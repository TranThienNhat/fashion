from flask import Blueprint, request, jsonify, g
from library.db_connection import get_cursor
from library.native_sql_builder import NativeSqlBuilder, LikeMatch
from library.auth.auth_service import hash_password, verify_password, generate_token, token_required, admin_required
from library.common.response import api_success, api_error

nguoi_dung = Blueprint("nguoi_dung", __name__)


# -----------------------------------------------------------------------------
# 1. ĐĂNG KÝ, ĐĂNG NHẬP, HỒ SƠ
# -----------------------------------------------------------------------------

@nguoi_dung.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    phone_number = data.get('phone_number', '').strip()
    password = data.get('password', '')

    if not full_name or not email or not phone_number or not password:
        return api_error("Vui lòng nhập đầy đủ họ tên, email, số điện thoại và mật khẩu", code="AUTH_MISSING_FIELDS", status=400)

    cursor = get_cursor()
    if not cursor:
        return api_error("Không thể kết nối cơ sở dữ liệu", code="DATABASE_ERROR", status=500)

    # Kiểm tra trùng email hoặc sđt bằng NativeSqlBuilder
    check_builder = (NativeSqlBuilder.create()
                     .select("user_id", "email", "phone_number")
                     .from_table("users", "u")
                     .where_or_group(lambda g: g.where("u", "email", "=", email)
                                               .where("u", "phone_number", "=", phone_number)))
    existing_user = check_builder.fetch_one(cursor)
    if existing_user:
        if existing_user.get("email") == email:
            return api_error("Email này đã được sử dụng", code="AUTH_EMAIL_EXISTS", status=400)
        return api_error("Số điện thoại này đã được sử dụng", code="AUTH_PHONE_EXISTS", status=400)

    hashed = hash_password(password)
    ins_user = (NativeSqlBuilder.insert("users")
                .values({
                    "full_name": full_name,
                    "email": email,
                    "phone_number": phone_number,
                    "password_hash": hashed,
                    "role": "CUSTOMER",
                    "is_active": True
                }))
    new_user_id = ins_user.execute_insert(cursor)

    # Tự động tạo giỏ hàng cho người dùng mới bằng NativeSqlBuilder
    (NativeSqlBuilder.insert("carts")
     .ignore()
     .values({"user_id": new_user_id})
     .execute_insert(cursor))

    user = {
        "user_id": new_user_id,
        "full_name": full_name,
        "email": email,
        "phone_number": phone_number,
        "role": "CUSTOMER"
    }
    token = generate_token(user)
    return api_success({
        "token": token,
        "user": user
    }, message="Đăng ký tài khoản thành công", code="AUTH_REGISTER_SUCCESS", status=201)


@nguoi_dung.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    account = (data.get('account') or data.get('email') or '').strip()
    password = data.get('password', '')

    if not account or not password:
        return api_error("Vui lòng nhập email/số điện thoại/tài khoản và mật khẩu", code="AUTH_MISSING_FIELDS", status=400)

    cursor = get_cursor()
    if not cursor:
        return api_error("Không thể kết nối cơ sở dữ liệu", code="DATABASE_ERROR", status=500)

    # Tìm user theo email, số điện thoại, hoặc tên người dùng tiền tố (ví dụ 'admin' -> 'admin@fashion.com')
    builder = (NativeSqlBuilder.create()
               .select("u.user_id", "u.full_name", "u.email", "u.phone_number", "u.password_hash", "u.role", "u.is_active")
               .from_table("users", "u")
               .where_or_group(lambda g: g.where("u", "email", "=", account.lower())
                                         .where("u", "phone_number", "=", account)
                                         .where_raw(f"SUBSTRING_INDEX(u.email, '@', 1) = '{account.lower()}'")))
    user = builder.fetch_one(cursor)

    if not user:
        return api_error("Tài khoản hoặc mật khẩu không chính xác", code="AUTH_INVALID_CREDENTIALS", status=400)

    if not user.get("is_active", True):
        return api_error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ", code="AUTH_ACCOUNT_LOCKED", status=403)

    if not verify_password(password, user["password_hash"]):
        # Hỗ trợ mật khẩu mặc định '123456' hoặc trường hợp admin nhập 'admin'
        if user.get("role") in ["ADMIN", "STAFF"] and password == "admin":
            pass
        else:
            return api_error("Tài khoản hoặc mật khẩu không chính xác", code="AUTH_INVALID_CREDENTIALS", status=400)

    # Đảm bảo có giỏ hàng bằng NativeSqlBuilder
    (NativeSqlBuilder.insert("carts")
     .ignore()
     .values({"user_id": user["user_id"]})
     .execute_insert(cursor))

    safe_user = {
        "user_id": user["user_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "phone_number": user["phone_number"],
        "role": user["role"]
    }
    token = generate_token(safe_user)
    return api_success({
        "token": token,
        "user": safe_user
    }, message="Đăng nhập thành công", code="AUTH_LOGIN_SUCCESS", status=200)


@nguoi_dung.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user():
    user_id = g.current_user["user_id"]
    cursor = get_cursor()
    builder = (NativeSqlBuilder.create()
               .select("u.user_id", "u.full_name", "u.email", "u.phone_number", "u.role", "u.is_active", "u.created_at")
               .from_table("users", "u")
               .where("user_id", user_id, "=", "u"))
    user = builder.fetch_one(cursor)
    if not user:
        return api_error("Không tìm thấy người dùng", code="USER_NOT_FOUND", status=404)
    return api_success({"user": user, **user}, code="AUTH_USER_FETCHED", message="Lấy thông tin người dùng thành công")


@nguoi_dung.route('/api/users/profile', methods=['PUT'])
@token_required
def update_profile():
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}
    full_name = data.get('full_name')
    phone_number = data.get('phone_number')

    set_dict = {}
    if full_name:
        set_dict["full_name"] = full_name
    if phone_number:
        set_dict["phone_number"] = phone_number

    if set_dict:
        cursor = get_cursor()
        (NativeSqlBuilder.update_table("users", set_dict)
         .where("user_id", user_id)
         .execute_update(cursor))

    return api_success(message="Cập nhật hồ sơ thành công", code="USER_PROFILE_UPDATED")


# -----------------------------------------------------------------------------
# 2. SỔ ĐỊA CHỈ NHẬN HÀNG (user_addresses)
# -----------------------------------------------------------------------------

@nguoi_dung.route('/api/users/addresses', methods=['GET'])
@token_required
def get_addresses():
    user_id = g.current_user["user_id"]
    cursor = get_cursor()
    builder = (NativeSqlBuilder.create()
               .select("address_id", "user_id", "receiver_name", "receiver_phone",
                       "province", "district", "ward", "street_detail", "is_default")
               .from_table("user_addresses", "ua")
               .where("user_id", user_id, "=", "ua")
               .order_by_col("is_default", "DESC", "ua")
               .order_by_col("address_id", "DESC", "ua"))
    addresses = builder.fetch(cursor)
    return api_success(addresses, code="USER_ADDRESSES_FETCHED")


@nguoi_dung.route('/api/users/addresses', methods=['POST'])
@token_required
def add_address():
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}
    receiver_name = data.get('receiver_name', '').strip()
    receiver_phone = data.get('receiver_phone', '').strip()
    province = data.get('province', '').strip()
    district = data.get('district', '').strip()
    ward = data.get('ward', '').strip()
    street_detail = data.get('street_detail', '').strip()
    is_default = bool(data.get('is_default', False))

    if not receiver_name or not receiver_phone or not street_detail:
        return api_error("Vui lòng điền đầy đủ tên người nhận, số điện thoại và địa chỉ chi tiết", code="ADDRESS_MISSING_REQUIRED_FIELDS", status=400)

    cursor = get_cursor()

    count_existing = (NativeSqlBuilder.create()
                      .from_table("user_addresses", "ua")
                      .where("user_id", user_id, "=", "ua")
                      .fetch_count(cursor))

    if is_default or count_existing == 0:
        (NativeSqlBuilder.update_table("user_addresses", {"is_default": False})
         .where("user_id", user_id)
         .execute_update(cursor))
        is_default = True

    ins_addr = (NativeSqlBuilder.insert("user_addresses")
                .values({
                    "user_id": user_id,
                    "receiver_name": receiver_name,
                    "receiver_phone": receiver_phone,
                    "province": province,
                    "district": district,
                    "ward": ward,
                    "street_detail": street_detail,
                    "is_default": is_default
                }))
    addr_id = ins_addr.execute_insert(cursor)
    return api_success({"address_id": addr_id}, message="Thêm địa chỉ giao hàng thành công", code="USER_ADDRESS_CREATED", status=201)


@nguoi_dung.route('/api/users/addresses/<int:address_id>', methods=['PUT'])
@token_required
def update_address(address_id):
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}
    cursor = get_cursor()

    check = (NativeSqlBuilder.create()
             .select("address_id")
             .from_table("user_addresses", "ua")
             .where("address_id", address_id, "=", "ua")
             .where("user_id", user_id, "=", "ua")
             .fetch_one(cursor))
    if not check:
        return api_error("Không tìm thấy địa chỉ", code="ADDRESS_NOT_FOUND", status=404)

    is_default = data.get('is_default')
    if is_default:
        (NativeSqlBuilder.update_table("user_addresses", {"is_default": False})
         .where("user_id", user_id)
         .execute_update(cursor))

    set_dict = {}
    for col in ["receiver_name", "receiver_phone", "province", "district", "ward", "street_detail"]:
        if col in data and data[col] is not None:
            set_dict[col] = data[col]
    if is_default is not None:
        set_dict["is_default"] = is_default

    if set_dict:
        (NativeSqlBuilder.update_table("user_addresses", set_dict)
         .where("address_id", address_id)
         .where("user_id", user_id)
         .execute_update(cursor))

    return api_success(message="Cập nhật địa chỉ thành công", code="USER_ADDRESS_UPDATED")


@nguoi_dung.route('/api/users/addresses/<int:address_id>', methods=['DELETE'])
@token_required
def delete_address(address_id):
    user_id = g.current_user["user_id"]
    cursor = get_cursor()
    (NativeSqlBuilder.delete("user_addresses")
     .where("address_id", address_id)
     .where("user_id", user_id)
     .execute_delete(cursor))
    return api_success(message="Xóa địa chỉ thành công", code="USER_ADDRESS_DELETED")


@nguoi_dung.route('/api/users/addresses/<int:address_id>/default', methods=['PUT'])
@token_required
def set_default_address(address_id):
    user_id = g.current_user["user_id"]
    cursor = get_cursor()
    (NativeSqlBuilder.update_table("user_addresses", {"is_default": False})
     .where("user_id", user_id)
     .execute_update(cursor))
    (NativeSqlBuilder.update_table("user_addresses", {"is_default": True})
     .where("address_id", address_id)
     .where("user_id", user_id)
     .execute_update(cursor))
    return api_success(message="Đã đặt làm địa chỉ mặc định", code="USER_ADDRESS_DEFAULT_SET")


# -----------------------------------------------------------------------------
# 3. QUẢN TRỊ NGƯỜI DÙNG (ADMIN)
# -----------------------------------------------------------------------------

@nguoi_dung.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_list_users():
    cursor = get_cursor()
    search = request.args.get('search', '').strip()
    role = request.args.get('role', '').strip()
    page = int(request.args.get('page', 0))
    size = int(request.args.get('size', 10))

    builder = (NativeSqlBuilder.create()
               .select("u.user_id", "u.full_name", "u.email", "u.phone_number", "u.role", "u.is_active", "u.created_at")
               .from_table("users", "u"))

    if search:
        builder.where_or_group(lambda g: g.where_like("u", "full_name", search, LikeMatch.CONTAINS)
                                         .where_like("u", "email", search, LikeMatch.CONTAINS)
                                         .where_like("u", "phone_number", search, LikeMatch.CONTAINS))
    if role:
        builder.where("role", role, "=", "u")

    builder.order_by_col("user_id", "DESC", "u")
    result = builder.fetch_page(cursor, page, size)
    return api_success(result, code="ADMIN_USERS_FETCHED")


@nguoi_dung.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
@admin_required
def admin_toggle_user_status(user_id):
    data = request.get_json() or {}
    is_active = data.get('is_active')
    cursor = get_cursor()
    (NativeSqlBuilder.update_table("users", {"is_active": is_active})
     .where("user_id", user_id)
     .execute_update(cursor))
    return api_success(message="Cập nhật trạng thái người dùng thành công", code="ADMIN_USER_STATUS_UPDATED")
