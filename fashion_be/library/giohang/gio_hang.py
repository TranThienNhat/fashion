from flask import Blueprint, request, jsonify, g
from library.db_connection import get_cursor
from library.native_sql_builder import NativeSqlBuilder
from library.auth.auth_service import token_required
from library.common.response import api_success, api_error

gio_hang = Blueprint("gio_hang", __name__)


def _get_or_create_cart_id(cursor, user_id: int) -> int:
    builder = (NativeSqlBuilder.create()
               .select("cart_id")
               .from_table("carts", "c")
               .where("user_id", user_id, "=", "c"))
    row = builder.fetch_one(cursor)
    if row:
        return row["cart_id"]

    ins = (NativeSqlBuilder.insert("carts")
           .ignore()
           .values({"user_id": user_id}))
    return ins.execute_insert(cursor)


@gio_hang.route('/api/cart', methods=['GET'])
@token_required
def get_cart():
    user_id = g.current_user["user_id"]
    cursor = get_cursor()
    cart_id = _get_or_create_cart_id(cursor, user_id)

    builder = (NativeSqlBuilder.create()
               .select("ci.cart_item_id", "ci.cart_id", "ci.variant_id", "ci.quantity",
                       "pv.sku", "pv.color", "pv.size", "pv.price", "pv.stock_quantity",
                       "p.product_id", "p.name AS product_name", "p.thumbnail",
                       "(ci.quantity * pv.price) AS subtotal")
               .from_table("cart_items", "ci")
               .inner_join("product_variants", "pv", "ci.variant_id = pv.variant_id")
               .inner_join("products", "p", "pv.product_id = p.product_id")
               .where("cart_id", cart_id, "=", "ci")
               .order_by_col("cart_item_id", "DESC", "ci"))

    items = builder.fetch(cursor)
    total_amount = sum(float(item["subtotal"]) for item in items)
    total_quantity = sum(int(item["quantity"]) for item in items)

    return api_success({
        "cart_id": cart_id,
        "items": items,
        "total_quantity": total_quantity,
        "total_amount": total_amount
    }, code="CART_FETCHED", message="Lấy thông tin giỏ hàng thành công")


@gio_hang.route('/api/cart/add', methods=['POST'])
@token_required
def add_to_cart():
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}
    variant_id = data.get("variant_id")
    quantity = int(data.get("quantity", 1))

    if not variant_id or quantity <= 0:
        return api_error("Thông tin sản phẩm hoặc số lượng không hợp lệ", code="CART_INVALID_INPUT", status=400)

    cursor = get_cursor()
    # Kiểm tra tồn kho của variant
    var_check = (NativeSqlBuilder.create()
                 .select("pv.variant_id", "pv.stock_quantity", "pv.price", "p.name AS product_name")
                 .from_table("product_variants", "pv")
                 .inner_join("products", "p", "pv.product_id = p.product_id")
                 .where("variant_id", variant_id, "=", "pv")
                 .fetch_one(cursor))

    if not var_check:
        return api_error("Biến thể sản phẩm không tồn tại", code="VARIANT_NOT_FOUND", status=404)

    available_stock = int(var_check["stock_quantity"])
    if available_stock < quantity:
        return api_error(
            f"Sản phẩm {var_check['product_name']} chỉ còn {available_stock} sản phẩm khả dụng",
            code="STOCK_INSUFFICIENT",
            status=400
        )

    cart_id = _get_or_create_cart_id(cursor, user_id)

    # Kiểm tra xem item đã có trong giỏ chưa
    existing_item = (NativeSqlBuilder.create()
                     .select("cart_item_id", "quantity")
                     .from_table("cart_items", "ci")
                     .where("cart_id", cart_id, "=", "ci")
                     .where("variant_id", variant_id, "=", "ci")
                     .fetch_one(cursor))

    if existing_item:
        new_quantity = existing_item["quantity"] + quantity
        if new_quantity > available_stock:
            return api_error(
                f"Không thể thêm. Giỏ hàng đã có {existing_item['quantity']}, tồn kho chỉ còn {available_stock}",
                code="STOCK_LIMIT_EXCEEDED",
                status=400
            )
        (NativeSqlBuilder.update_table("cart_items")
         .set({"quantity": new_quantity})
         .where("cart_item_id", existing_item["cart_item_id"])
         .execute_update(cursor))
    else:
        (NativeSqlBuilder.insert("cart_items")
         .values({
             "cart_id": cart_id,
             "variant_id": variant_id,
             "quantity": quantity
         })
         .execute_insert(cursor))

    return api_success(message="Thêm vào giỏ hàng thành công", code="CART_ITEM_ADDED")


@gio_hang.route('/api/cart/items/<int:cart_item_id>', methods=['PUT'])
@token_required
def update_cart_item(cart_item_id):
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}
    quantity = int(data.get("quantity", 1))

    if quantity <= 0:
        return api_error("Số lượng phải lớn hơn 0", code="CART_INVALID_QUANTITY", status=400)

    cursor = get_cursor()
    cart_id = _get_or_create_cart_id(cursor, user_id)

    # Kiểm tra tồn kho
    item = (NativeSqlBuilder.create()
            .select("ci.cart_item_id", "ci.variant_id", "pv.stock_quantity")
            .from_table("cart_items", "ci")
            .inner_join("product_variants", "pv", "ci.variant_id = pv.variant_id")
            .where("cart_item_id", cart_item_id, "=", "ci")
            .where("cart_id", cart_id, "=", "ci")
            .fetch_one(cursor))

    if not item:
        return api_error("Không tìm thấy mặt hàng trong giỏ", code="CART_ITEM_NOT_FOUND", status=404)

    if quantity > item["stock_quantity"]:
        return api_error(
            f"Số lượng tồn chỉ còn {item['stock_quantity']}",
            code="STOCK_INSUFFICIENT",
            status=400
        )

    (NativeSqlBuilder.update_table("cart_items")
     .set({"quantity": quantity})
     .where("cart_item_id", cart_item_id)
     .execute_update(cursor))
    return api_success(message="Cập nhật giỏ hàng thành công", code="CART_ITEM_UPDATED")


@gio_hang.route('/api/cart/items/<int:cart_item_id>', methods=['DELETE'])
@token_required
def delete_cart_item(cart_item_id):
    user_id = g.current_user["user_id"]
    cursor = get_cursor()
    cart_id = _get_or_create_cart_id(cursor, user_id)
    (NativeSqlBuilder.delete("cart_items")
     .where("cart_item_id", cart_item_id)
     .where("cart_id", cart_id)
     .execute_delete(cursor))
    return api_success(message="Đã xóa mặt hàng khỏi giỏ", code="CART_ITEM_REMOVED")


@gio_hang.route('/api/cart/clear', methods=['DELETE'])
@token_required
def clear_cart():
    user_id = g.current_user["user_id"]
    cursor = get_cursor()
    cart_id = _get_or_create_cart_id(cursor, user_id)
    (NativeSqlBuilder.delete("cart_items")
     .where("cart_id", cart_id)
     .execute_delete(cursor))
    return api_success(message="Đã làm trống giỏ hàng", code="CART_CLEARED")
