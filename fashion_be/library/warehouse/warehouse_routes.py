import time
import random
from flask import Blueprint, request, jsonify, g
from library.db_connection import get_cursor
from library.native_sql_builder import NativeSqlBuilder, LikeMatch
from library.auth.auth_service import admin_required
from library.common.response import api_success, api_error

warehouse_bp = Blueprint("warehouse", __name__)


def generate_receipt_code() -> str:
    millis = int(time.time() * 1000)
    rand = random.randint(100, 999)
    return f"REC-{millis % 10000000}-{rand}"


# =============================================================================
# 1. NHÀ CUNG CẤP (SUPPLIERS)
# =============================================================================

@warehouse_bp.route('/api/admin/suppliers', methods=['GET'])
@admin_required
def get_suppliers():
    cursor = get_cursor()
    search = request.args.get('search', '').strip()
    builder = (NativeSqlBuilder.create()
               .select("supplier_id", "name", "contact_name", "phone", "email", "address", "is_active")
               .from_table("suppliers", "s")
               .order_by_col("supplier_id", "DESC", "s"))
    if search:
        builder.where_or_group(lambda g: g.where_like("s", "name", search, LikeMatch.CONTAINS)
                                         .where_like("s", "phone", search, LikeMatch.CONTAINS)
                                         .where_like("s", "contact_name", search, LikeMatch.CONTAINS))
    return api_success(builder.fetch(cursor), code="SUPPLIERS_FETCHED", message="Lấy danh sách nhà cung cấp thành công")


@warehouse_bp.route('/api/admin/suppliers', methods=['POST'])
@admin_required
def create_supplier():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    contact_name = data.get("contact_name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip()
    address = data.get("address", "").strip()

    if not name or not phone:
        return api_error(
            "Vui lòng nhập tên nhà cung cấp và số điện thoại liên hệ",
            code="SUPPLIER_MISSING_FIELDS",
            status=400
        )

    cursor = get_cursor()
    ins = (NativeSqlBuilder.insert("suppliers")
           .values({
               "name": name,
               "contact_name": contact_name,
               "phone": phone,
               "email": email,
               "address": address,
               "is_active": True
           }))
    supplier_id = ins.execute_insert(cursor)
    return api_success({"supplier_id": supplier_id}, message="Thêm nhà cung cấp thành công", code="SUPPLIER_CREATED", status=201)


@warehouse_bp.route('/api/admin/suppliers/<int:supplier_id>', methods=['PUT'])
@admin_required
def update_supplier(supplier_id):
    data = request.get_json() or {}
    cursor = get_cursor()

    set_data = {
        "name": data.get("name"),
        "contact_name": data.get("contact_name"),
        "phone": data.get("phone"),
        "email": data.get("email"),
        "address": data.get("address"),
        "is_active": data.get("is_active", True)
    }

    (NativeSqlBuilder.update_table("suppliers")
     .set(set_data)
     .where("supplier_id", supplier_id)
     .execute_update(cursor))

    return api_success(message="Cập nhật thông tin nhà cung cấp thành công", code="SUPPLIER_UPDATED")


@warehouse_bp.route('/api/admin/suppliers/<int:supplier_id>', methods=['DELETE'])
@admin_required
def delete_supplier(supplier_id):
    cursor = get_cursor()
    (NativeSqlBuilder.update_table("suppliers", {"is_active": False})
     .where("supplier_id", supplier_id)
     .execute_update(cursor))
    return api_success(message="Đã ngừng hợp tác với nhà cung cấp", code="SUPPLIER_DELETED")


# =============================================================================
# 2. PHIẾU NHẬP KHO (PURCHASE RECEIPTS) & CỘNG TỒN KHO TỰ ĐỘNG
# =============================================================================

@warehouse_bp.route('/api/admin/receipts', methods=['GET'])
@admin_required
def get_purchase_receipts():
    cursor = get_cursor()
    page = int(request.args.get('page', 0))
    size = int(request.args.get('size', 10))
    search = request.args.get('search', '').strip()

    builder = (NativeSqlBuilder.create()
               .select("pr.receipt_id", "pr.receipt_code", "pr.total_cost", "pr.note", "pr.received_at",
                       "s.name AS supplier_name", "s.phone AS supplier_phone",
                       "u.full_name AS creator_name",
                       "COUNT(pri.receipt_item_id) AS total_items")
               .from_table("purchase_receipts", "pr")
               .inner_join("suppliers", "s", "pr.supplier_id = s.supplier_id")
               .inner_join("users", "u", "pr.created_by = u.user_id")
               .left_join("purchase_receipt_items", "pri", "pr.receipt_id = pri.receipt_id")
               .group_by("pr.receipt_id, pr.receipt_code, pr.total_cost, pr.note, pr.received_at, s.name, s.phone, u.full_name"))

    if search:
        builder.where_or_group(lambda g: g.where_like("pr", "receipt_code", search, LikeMatch.CONTAINS)
                                         .where_like("s", "name", search, LikeMatch.CONTAINS))

    builder.order_by_col("receipt_id", "DESC", "pr")
    result = builder.fetch_page(cursor, page, size)
    return api_success(result, code="RECEIPTS_FETCHED", message="Lấy danh sách phiếu nhập kho thành công")


@warehouse_bp.route('/api/admin/receipts/<int:receipt_id>', methods=['GET'])
@admin_required
def get_purchase_receipt_detail(receipt_id):
    cursor = get_cursor()
    receipt = (NativeSqlBuilder.create()
               .select("pr.*", "s.name AS supplier_name", "s.phone AS supplier_phone", "u.full_name AS creator_name")
               .from_table("purchase_receipts", "pr")
               .inner_join("suppliers", "s", "pr.supplier_id = s.supplier_id")
               .inner_join("users", "u", "pr.created_by = u.user_id")
               .where("receipt_id", receipt_id, "=", "pr")
               .fetch_one(cursor))

    if not receipt:
        return api_error("Không tìm thấy phiếu nhập kho", code="RECEIPT_NOT_FOUND", status=404)

    items = (NativeSqlBuilder.create()
             .select("pri.*", "pv.sku", "pv.color", "pv.size", "p.name AS product_name")
             .from_table("purchase_receipt_items", "pri")
             .inner_join("product_variants", "pv", "pri.variant_id = pv.variant_id")
             .inner_join("products", "p", "pv.product_id = p.product_id")
             .where("receipt_id", receipt_id, "=", "pri")
             .fetch(cursor))

    receipt["items"] = items
    return api_success(receipt, code="RECEIPT_DETAIL_FETCHED", message="Lấy chi tiết phiếu nhập kho thành công")


@warehouse_bp.route('/api/admin/receipts', methods=['POST'])
@admin_required
def create_purchase_receipt():
    """
    Tạo phiếu nhập kho:
    - Chọn nhà cung cấp, ghi chú.
    - Nhập danh sách mặt hàng: variant_id, import_price, quantity.
    - TỰ ĐỘNG CỘNG DỒN VÀO product_variants.stock_quantity dùng NativeSqlBuilder!
    """
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}
    supplier_id = data.get("supplier_id")
    note = data.get("note", "")
    items = data.get("items", [])

    if not supplier_id or not items:
        return api_error(
            "Vui lòng chọn nhà cung cấp và nhập ít nhất một mặt hàng nhập kho",
            code="RECEIPT_MISSING_FIELDS",
            status=400
        )

    cursor = get_cursor()

    total_cost = sum(float(it.get("import_price", 0)) * int(it.get("quantity", 0)) for it in items)
    receipt_code = generate_receipt_code()

    # 1. Tạo phiếu nhập kho
    ins_rec = (NativeSqlBuilder.insert("purchase_receipts")
               .values({
                   "receipt_code": receipt_code,
                   "supplier_id": supplier_id,
                   "created_by": user_id,
                   "total_cost": total_cost,
                   "note": note
               }))
    receipt_id = ins_rec.execute_insert(cursor)

    # 2. Thêm các dòng chi tiết và cộng dồn tồn kho
    for it in items:
        vid = it["variant_id"]
        price = float(it["import_price"])
        qty = int(it["quantity"])

        (NativeSqlBuilder.insert("purchase_receipt_items")
         .values({
             "receipt_id": receipt_id,
             "variant_id": vid,
             "import_price": price,
             "quantity": qty
         })
         .execute_insert(cursor))

        # CỘNG TỒN KHO TỰ ĐỘNG
        (NativeSqlBuilder.update_table("product_variants")
         .set_expr("stock_quantity", "stock_quantity + %s", qty)
         .where("variant_id", vid)
         .execute_update(cursor))

    return api_success({
        "receipt_id": receipt_id,
        "receipt_code": receipt_code,
        "total_cost": total_cost
    }, message="Lập phiếu nhập kho thành công và đã tự động cập nhật tồn kho", code="RECEIPT_CREATED", status=201)
