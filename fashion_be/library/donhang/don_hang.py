import time
import random
from flask import Blueprint, request, jsonify, g
from library.db_connection import get_cursor, get_db
from library.native_sql_builder import NativeSqlBuilder, LikeMatch
from library.auth.auth_service import token_required, admin_required
from library.common.response import api_success, api_error

don_hang = Blueprint("don_hang", __name__)


def generate_order_code() -> str:
    millis = int(time.time() * 1000)
    rand = random.randint(100, 999)
    return f"FASH-{millis % 10000000}-{rand}"


# =============================================================================
# 1. KHỞI TẠO ĐƠN HÀNG (CUSTOMER)
# =============================================================================

@don_hang.route('/api/orders/checkout', methods=['POST'])
@token_required
def checkout():
    """
    Đặt hàng từ giỏ hàng hoặc chế độ "Mua ngay" (Buy Now).
    Tự động kiểm tra và trừ tồn kho product_variants bằng NativeSqlBuilder.
    """
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}

    receiver_name = (data.get("receiver_name") or data.get("recipient_name") or data.get("full_name") or "").strip()
    receiver_phone = (data.get("receiver_phone") or data.get("phone_number") or data.get("phone") or "").strip()
    shipping_address = (data.get("shipping_address") or data.get("address") or "").strip()
    payment_method = data.get("payment_method", "COD")  # COD, VNPAY, MOMO, BANKING
    note = data.get("note", "")
    items_to_buy = data.get("items")

    if not receiver_name or not receiver_phone or not shipping_address:
        return api_error(
            "Vui lòng nhập đầy đủ thông tin người nhận và địa chỉ giao hàng",
            code="ORDER_MISSING_SHIPPING_INFO",
            status=400
        )

    cursor = get_cursor()

    # Xác định danh sách mặt hàng cần mua
    checkout_items = []
    cart_id = None

    if items_to_buy and len(items_to_buy) > 0:
        # Chế độ Mua ngay (Buy Now)
        for item in items_to_buy:
            vid = item.get("variant_id")
            qty = int(item.get("quantity", 1))
            builder = (NativeSqlBuilder.create()
                       .select("pv.variant_id", "pv.sku", "pv.color", "pv.size", "pv.price", "pv.stock_quantity",
                               "p.name AS product_name")
                       .from_table("product_variants", "pv")
                       .inner_join("products", "p", "pv.product_id = p.product_id")
                       .where("variant_id", vid, "=", "pv"))
            vinfo = builder.fetch_one(cursor)
            if not vinfo:
                return api_error(f"Sản phẩm với biến thể #{vid} không tồn tại", code="VARIANT_NOT_FOUND", status=404)
            if vinfo["stock_quantity"] < qty:
                return api_error(
                    f"Sản phẩm {vinfo['product_name']} ({vinfo['color']} - {vinfo['size']}) chỉ còn {vinfo['stock_quantity']} chiếc",
                    code="STOCK_INSUFFICIENT",
                    status=400
                )
            checkout_items.append({
                "variant_id": vid,
                "quantity": qty,
                "product_name": vinfo["product_name"],
                "sku": vinfo["sku"],
                "color": vinfo["color"],
                "size": vinfo["size"],
                "price": float(vinfo["price"]),
                "total_price": float(vinfo["price"]) * qty
            })
    else:
        # Mua từ giỏ hàng
        cart_row = (NativeSqlBuilder.create()
                    .select("cart_id")
                    .from_table("carts", "c")
                    .where("user_id", user_id, "=", "c")
                    .fetch_one(cursor))
        if not cart_row:
            return api_error("Giỏ hàng của bạn đang trống", code="CART_EMPTY", status=400)
        cart_id = cart_row["cart_id"]

        cart_items_builder = (NativeSqlBuilder.create()
                              .select("ci.cart_item_id", "ci.variant_id", "ci.quantity",
                                      "pv.sku", "pv.color", "pv.size", "pv.price", "pv.stock_quantity",
                                      "p.name AS product_name")
                              .from_table("cart_items", "ci")
                              .inner_join("product_variants", "pv", "ci.variant_id = pv.variant_id")
                              .inner_join("products", "p", "pv.product_id = p.product_id")
                              .where("cart_id", cart_id, "=", "ci"))
        db_items = cart_items_builder.fetch(cursor)
        if not db_items:
            return api_error("Giỏ hàng của bạn đang trống", code="CART_EMPTY", status=400)

        for item in db_items:
            qty = int(item["quantity"])
            if item["stock_quantity"] < qty:
                return api_error(
                    f"Sản phẩm {item['product_name']} ({item['color']} - {item['size']}) không đủ tồn kho (chỉ còn {item['stock_quantity']})",
                    code="STOCK_INSUFFICIENT",
                    status=400
                )
            checkout_items.append({
                "variant_id": item["variant_id"],
                "quantity": qty,
                "product_name": item["product_name"],
                "sku": item["sku"],
                "color": item["color"],
                "size": item["size"],
                "price": float(item["price"]),
                "total_price": float(item["price"]) * qty
            })

    total_amount = sum(it["total_price"] for it in checkout_items)
    order_code = generate_order_code()

    # 1. Tạo đơn hàng trong bảng orders
    ins_order = (NativeSqlBuilder.insert("orders")
                 .values({
                     "order_code": order_code,
                     "user_id": user_id,
                     "receiver_name": receiver_name,
                     "receiver_phone": receiver_phone,
                     "shipping_address": shipping_address,
                     "total_amount": total_amount,
                     "order_status": "PENDING",
                     "payment_method": payment_method,
                     "payment_status": "UNPAID",
                     "note": note
                 }))
    order_id = ins_order.execute_insert(cursor)

    # 2. Tạo chi tiết đơn hàng order_items và trừ số lượng tồn kho product_variants
    for it in checkout_items:
        (NativeSqlBuilder.insert("order_items")
         .values({
             "order_id": order_id,
             "variant_id": it["variant_id"],
             "product_name": it["product_name"],
             "variant_sku": it["sku"],
             "color": it["color"],
             "size": it["size"],
             "price": it["price"],
             "quantity": it["quantity"],
             "total_price": it["total_price"]
         })
         .execute_insert(cursor))

        # Trừ tồn kho
        (NativeSqlBuilder.update_table("product_variants")
         .set_expr("stock_quantity", "stock_quantity - %s", it["quantity"])
         .where("variant_id", it["variant_id"])
         .execute_update(cursor))

    # 3. Làm trống giỏ hàng nếu đặt từ giỏ hàng
    if not items_to_buy and cart_id:
        (NativeSqlBuilder.delete("cart_items")
         .where("cart_id", cart_id)
         .execute_delete(cursor))

    return api_success({
        "order_id": order_id,
        "order_code": order_code,
        "total_amount": total_amount,
        "payment_method": payment_method
    }, message="Đặt hàng thành công", code="ORDER_CREATED", status=201)


# =============================================================================
# 2. LỊCH SỬ & CHI TIẾT ĐƠN HÀNG (CUSTOMER)
# =============================================================================

@don_hang.route('/api/orders/my-orders', methods=['GET'])
@token_required
def get_my_orders():
    user_id = g.current_user["user_id"]
    cursor = get_cursor()

    builder = (NativeSqlBuilder.create()
               .select("o.order_id", "o.order_code", "o.total_amount", "o.order_status",
                       "o.payment_method", "o.payment_status", "o.created_at",
                       "o.receiver_name", "o.receiver_phone", "o.shipping_address",
                       "COALESCE(o.address_changed_count, 0) AS address_changed_count",
                       "COUNT(oi.order_item_id) AS total_items")
               .from_table("orders", "o")
               .left_join("order_items", "oi", "o.order_id = oi.order_id")
               .where("user_id", user_id, "=", "o")
               .group_by("o.order_id, o.order_code, o.total_amount, o.order_status, o.payment_method, o.payment_status, o.created_at, o.receiver_name, o.receiver_phone, o.shipping_address, o.address_changed_count")
               .order_by_col("order_id", "DESC", "o"))

    orders = builder.fetch(cursor)
    return api_success(orders, code="ORDERS_FETCHED", message="Lấy danh sách đơn hàng thành công")


@don_hang.route('/api/orders/<int:order_id>', methods=['GET'])
@token_required
def get_order_detail(order_id):
    user_id = g.current_user["user_id"]
    role = g.current_user.get("role")
    cursor = get_cursor()

    order_builder = (NativeSqlBuilder.create()
                     .select("o.*")
                     .from_table("orders", "o")
                     .where("order_id", order_id, "=", "o"))
    if role not in ["ADMIN", "STAFF"]:
        order_builder.where("user_id", user_id, "=", "o")

    order = order_builder.fetch_one(cursor)
    if not order:
        return api_error("Không tìm thấy đơn hàng", code="ORDER_NOT_FOUND", status=404)

    # Lấy danh sách item kèm hình ảnh sản phẩm
    item_builder = (NativeSqlBuilder.create()
                    .select("oi.*", "pv.product_id", "p.thumbnail")
                    .from_table("order_items", "oi")
                    .left_join("product_variants", "pv", "oi.variant_id = pv.variant_id")
                    .left_join("products", "p", "pv.product_id = p.product_id")
                    .where("order_id", order_id, "=", "oi"))
    order["items"] = item_builder.fetch(cursor)

    return api_success(order, code="ORDER_DETAIL_FETCHED", message="Lấy chi tiết đơn hàng thành công")


@don_hang.route('/api/orders/<int:order_id>/address', methods=['PUT'])
@token_required
def update_order_address(order_id):
    """
    Cập nhật địa chỉ nhận hàng của đơn hàng:
    - Chỉ cho phép khi đơn hàng ở trạng thái PENDING (đang xử lý / chờ xác nhận).
    - Chỉ được thay đổi tối đa 1 lần duy nhất (address_changed_count == 0).
    - Sau khi đã đổi 1 lần, hoặc đơn hàng đã sang trạng thái khác, không được đổi nữa!
    """
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}

    receiver_name = (data.get("receiver_name") or "").strip()
    receiver_phone = (data.get("receiver_phone") or "").strip()
    shipping_address = (data.get("shipping_address") or "").strip()

    if not receiver_name or not receiver_phone or not shipping_address:
        return api_error("Vui lòng cung cấp đầy đủ tên người nhận, số điện thoại và địa chỉ giao hàng", code="ORDER_MISSING_ADDRESS_INFO", status=400)

    cursor = get_cursor()
    order = (NativeSqlBuilder.create()
             .select("order_id", "order_status", "COALESCE(address_changed_count, 0) AS address_changed_count")
             .from_table("orders", "o")
             .where("order_id", order_id, "=", "o")
             .where("user_id", user_id, "=", "o")
             .fetch_one(cursor))

    if not order:
        return api_error("Không tìm thấy đơn hàng", code="ORDER_NOT_FOUND", status=404)

    if order["order_status"] != "PENDING":
        return api_error(
            f"Đơn hàng hiện không ở trạng thái Chờ xử lý (hiện tại: {order['order_status']}). Không thể thay đổi địa chỉ nhận hàng.",
            code="ORDER_CANNOT_CHANGE_ADDRESS",
            status=400
        )

    if int(order.get("address_changed_count", 0)) >= 1:
        return api_error(
            "Địa chỉ nhận hàng của đơn hàng này đã được thay đổi 1 lần trước đó. Bạn không thể thay đổi thêm lần nào nữa.",
            code="ADDRESS_CHANGE_LIMIT_EXCEEDED",
            status=400
        )

    (NativeSqlBuilder.update_table("orders")
     .set({
         "receiver_name": receiver_name,
         "receiver_phone": receiver_phone,
         "shipping_address": shipping_address,
         "address_changed_count": 1
     })
     .where("order_id", order_id)
     .execute_update(cursor))

    return api_success(message="Đã cập nhật địa chỉ nhận hàng thành công (Lưu ý: chỉ được đổi 1 lần duy nhất)", code="ORDER_ADDRESS_UPDATED")


@don_hang.route('/api/orders/<int:order_id>/cancel', methods=['PUT'])
@token_required
def customer_cancel_order(order_id):
    user_id = g.current_user["user_id"]
    cursor = get_cursor()

    order = (NativeSqlBuilder.create()
             .select("order_id", "order_status")
             .from_table("orders", "o")
             .where("order_id", order_id, "=", "o")
             .where("user_id", user_id, "=", "o")
             .fetch_one(cursor))

    if not order:
        return api_error("Không tìm thấy đơn hàng", code="ORDER_NOT_FOUND", status=404)

    if order["order_status"] != "PENDING":
        return api_error(
            "Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xử lý (PENDING)",
            code="ORDER_CANNOT_CANCEL",
            status=400
        )

    # Hoàn tồn kho bằng NativeSqlBuilder
    items = (NativeSqlBuilder.create()
             .select("variant_id", "quantity")
             .from_table("order_items", "oi")
             .where("order_id", order_id, "=", "oi")
             .fetch(cursor))
    for it in items:
        (NativeSqlBuilder.update_table("product_variants")
         .set_expr("stock_quantity", "stock_quantity + %s", it["quantity"])
         .where("variant_id", it["variant_id"])
         .execute_update(cursor))

    (NativeSqlBuilder.update_table("orders", {"order_status": "CANCELLED"})
     .where("order_id", order_id)
     .execute_update(cursor))

    return api_success(message="Đã hủy đơn hàng thành công và hoàn trả tồn kho", code="ORDER_CANCELLED")


# =============================================================================
# 3. QUẢN LÝ ĐƠN HÀNG (ADMIN DASHBOARD)
# =============================================================================

@don_hang.route('/api/admin/orders', methods=['GET'])
@admin_required
def admin_get_orders():
    cursor = get_cursor()
    status = request.args.get('status')
    payment_status = request.args.get('payment_status')
    search = request.args.get('search', '').strip()
    page = int(request.args.get('page', 0))
    size = int(request.args.get('size', 10))

    builder = (NativeSqlBuilder.create()
               .select("o.order_id", "o.order_code", "o.receiver_name", "o.receiver_phone",
                       "o.total_amount", "o.order_status", "o.payment_method", "o.payment_status",
                       "o.created_at", "u.email AS user_email",
                       "COUNT(oi.order_item_id) AS item_count")
               .from_table("orders", "o")
               .left_join("users", "u", "o.user_id = u.user_id")
               .left_join("order_items", "oi", "o.order_id = oi.order_id")
               .group_by("o.order_id, o.order_code, o.receiver_name, o.receiver_phone, o.total_amount, o.order_status, o.payment_method, o.payment_status, o.created_at, u.email"))

    if status:
        builder.where("order_status", status, "=", "o")
    if payment_status:
        builder.where("payment_status", payment_status, "=", "o")
    if search:
        builder.where_or_group(lambda g: g.where_like("o", "order_code", search, LikeMatch.CONTAINS)
                                         .where_like("o", "receiver_name", search, LikeMatch.CONTAINS)
                                         .where_like("o", "receiver_phone", search, LikeMatch.CONTAINS)
                                         .where_like("u", "email", search, LikeMatch.CONTAINS))

    builder.order_by_col("order_id", "DESC", "o")
    result = builder.fetch_page(cursor, page, size)
    return api_success(result, code="ADMIN_ORDERS_FETCHED", message="Lấy danh sách đơn hàng quản trị thành công")


@don_hang.route('/api/admin/orders/<int:order_id>/status', methods=['PUT'])
@admin_required
def admin_update_order_status(order_id):
    """
    Cập nhật luồng vòng đời đơn hàng:
    PENDING -> CONFIRMED -> SHIPPING -> DELIVERED / CANCELLED.
    Tự động hoàn trả tồn kho nếu chuyển sang CANCELLED!
    """
    data = request.get_json() or {}
    new_status = data.get("order_status")
    cursor = get_cursor()

    current_order = (NativeSqlBuilder.create()
                     .select("order_id", "order_status")
                     .from_table("orders", "o")
                     .where("order_id", order_id, "=", "o")
                     .fetch_one(cursor))

    if not current_order:
        return api_error("Không tìm thấy đơn hàng", code="ORDER_NOT_FOUND", status=404)

    old_status = current_order["order_status"]

    # Nếu đơn hàng trước đó chưa hủy, nay chuyển sang CANCELLED -> Hoàn trả tồn kho
    if new_status == "CANCELLED" and old_status != "CANCELLED":
        items = (NativeSqlBuilder.create()
                 .select("variant_id", "quantity")
                 .from_table("order_items", "oi")
                 .where("order_id", order_id, "=", "oi")
                 .fetch(cursor))
        for it in items:
            (NativeSqlBuilder.update_table("product_variants")
             .set_expr("stock_quantity", "stock_quantity + %s", it["quantity"])
             .where("variant_id", it["variant_id"])
             .execute_update(cursor))

    (NativeSqlBuilder.update_table("orders", {"order_status": new_status})
     .where("order_id", order_id)
     .execute_update(cursor))
    return api_success(message=f"Cập nhật trạng thái đơn hàng sang {new_status} thành công", code="ORDER_STATUS_UPDATED")


@don_hang.route('/api/admin/orders/<int:order_id>/payment', methods=['PUT'])
@admin_required
def admin_update_payment_status(order_id):
    data = request.get_json() or {}
    payment_status = data.get("payment_status")  # UNPAID, PAID, REFUNDED
    transaction_code = data.get("transaction_code")
    cursor = get_cursor()

    set_data = {"payment_status": payment_status}
    if transaction_code:
        set_data["transaction_code"] = transaction_code

    upd = NativeSqlBuilder.update_table("orders").set(set_data)
    if payment_status == "PAID":
        upd.set_expr("paid_at", "NOW()")
    upd.where("order_id", order_id)
    upd.execute_update(cursor)

    return api_success(message="Cập nhật trạng thái thanh toán thành công", code="ORDER_PAYMENT_STATUS_UPDATED")
