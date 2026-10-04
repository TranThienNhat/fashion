import re
from flask import Blueprint, request, jsonify, g
from library.db_connection import get_cursor
from library.native_sql_builder import NativeSqlBuilder, LikeMatch
from library.auth.auth_service import admin_required
from library.common.response import api_success, api_error

catalog_bp = Blueprint("catalog", __name__)


def slugify(text: str) -> str:
    """Tạo slug chuẩn SEO từ tiêu đề."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')


# =============================================================================
# 1. CATEGORIES (DANH MỤC)
# =============================================================================

@catalog_bp.route('/api/categories', methods=['GET'])
def get_categories():
    cursor = get_cursor()
    all_cats = (NativeSqlBuilder.create()
                .select("c.category_id", "c.parent_id", "c.name", "c.slug", "c.is_active",
                        "p.name AS parent_name")
                .from_table("categories", "c")
                .left_join("categories", "p", "c.parent_id = p.category_id")
                .where("is_active", 1, "=", "c")
                .order_by_col("parent_id", "ASC", "c")
                .order_by_col("name", "ASC", "c")
                .fetch(cursor))

    # Xây dựng cấu trúc cây cha - con
    cat_map = {c["category_id"]: {**c, "children": []} for c in all_cats}
    tree = []
    for c in all_cats:
        pid = c.get("parent_id")
        if pid and pid in cat_map:
            cat_map[pid]["children"].append(cat_map[c["category_id"]])
        else:
            tree.append(cat_map[c["category_id"]])

    return api_success({"flat": all_cats, "tree": tree}, code="CATEGORIES_FETCHED")


@catalog_bp.route('/api/admin/categories', methods=['POST'])
@admin_required
def create_category():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    parent_id = data.get("parent_id")
    slug = data.get("slug", "").strip() or slugify(name)

    if not name:
        return api_error("Tên danh mục là bắt buộc", code="CATEGORY_NAME_REQUIRED", status=400)

    cursor = get_cursor()
    ins_builder = (NativeSqlBuilder.insert("categories")
                   .values({
                       "name": name,
                       "parent_id": parent_id if parent_id else None,
                       "slug": slug,
                       "is_active": True
                   }))
    category_id = ins_builder.execute_insert(cursor)
    return api_success({"category_id": category_id}, message="Tạo danh mục thành công", code="CATEGORY_CREATED", status=201)


@catalog_bp.route('/api/admin/categories/<int:cat_id>', methods=['PUT'])
@admin_required
def update_category(cat_id):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    parent_id = data.get("parent_id")
    slug = data.get("slug", "").strip() or slugify(name)
    is_active = data.get("is_active", True)

    cursor = get_cursor()
    (NativeSqlBuilder.update_table("categories")
     .set({
         "name": name,
         "parent_id": parent_id if parent_id else None,
         "slug": slug,
         "is_active": is_active
     })
     .where("category_id", cat_id)
     .execute_update(cursor))
    return api_success(message="Cập nhật danh mục thành công", code="CATEGORY_UPDATED")


@catalog_bp.route('/api/admin/categories/<int:cat_id>', methods=['DELETE'])
@admin_required
def delete_category(cat_id):
    cursor = get_cursor()
    (NativeSqlBuilder.update_table("categories", {"is_active": False})
     .where("category_id", cat_id)
     .execute_update(cursor))
    return api_success(message="Đã ẩn danh mục", code="CATEGORY_DELETED")


# =============================================================================
# 2. BRANDS (THƯƠNG HIỆU)
# =============================================================================

@catalog_bp.route('/api/brands', methods=['GET'])
def get_brands():
    cursor = get_cursor()
    brands = (NativeSqlBuilder.create()
              .select("brand_id", "name", "slug", "logo_url")
              .from_table("brands", "b")
              .order_by_col("name", "ASC", "b")
              .fetch(cursor))
    return api_success(brands, code="BRANDS_FETCHED")


@catalog_bp.route('/api/admin/brands', methods=['POST'])
@admin_required
def create_brand():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    logo_url = data.get("logo_url", "").strip()
    slug = data.get("slug", "").strip() or slugify(name)

    if not name:
        return api_error("Tên thương hiệu là bắt buộc", code="BRAND_NAME_REQUIRED", status=400)

    cursor = get_cursor()
    ins_builder = (NativeSqlBuilder.insert("brands")
                   .values({
                       "name": name,
                       "slug": slug,
                       "logo_url": logo_url
                   }))
    brand_id = ins_builder.execute_insert(cursor)
    return api_success({"brand_id": brand_id}, message="Tạo thương hiệu thành công", code="BRAND_CREATED", status=201)


@catalog_bp.route('/api/admin/brands/<int:brand_id>', methods=['PUT'])
@admin_required
def update_brand(brand_id):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    logo_url = data.get("logo_url", "").strip()
    slug = data.get("slug", "").strip() or slugify(name)

    cursor = get_cursor()
    (NativeSqlBuilder.update_table("brands")
     .set({
         "name": name,
         "slug": slug,
         "logo_url": logo_url
     })
     .where("brand_id", brand_id)
     .execute_update(cursor))
    return api_success(message="Cập nhật thương hiệu thành công", code="BRAND_UPDATED")


@catalog_bp.route('/api/admin/brands/<int:brand_id>', methods=['DELETE'])
@admin_required
def delete_brand(brand_id):
    cursor = get_cursor()
    (NativeSqlBuilder.delete("brands")
     .where("brand_id", brand_id)
     .execute_delete(cursor))
    return api_success(message="Đã xóa thương hiệu", code="BRAND_DELETED")


# =============================================================================
# 3. PRODUCTS & VARIANTS (SẢN PHẨM & BIẾN THỂ)
# =============================================================================

@catalog_bp.route('/api/products', methods=['GET'])
def get_products():
    """
    Duyệt danh sách sản phẩm với bộ lọc đa tiêu chí dùng NativeSqlBuilder:
    - category_id
    - brand_id
    - min_price, max_price
    - color, size
    - search
    - sort (newest, price_asc, price_desc, name_asc)
    - page, size
    """
    cursor = get_cursor()
    category_id = request.args.get('category_id')
    brand_id = request.args.get('brand_id')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    color = request.args.get('color')
    
    # Phân biệt kích thước quần áo (S, M, L...) và kích thước phân trang (10, 12, 20...)
    raw_size = request.args.get('clothing_size') or request.args.get('size')
    raw_page_size = request.args.get('page_size') or request.args.get('limit')
    
    clothing_size = None
    if raw_size and not raw_size.isdigit():
        clothing_size = raw_size
    elif request.args.get('clothing_size'):
        clothing_size = request.args.get('clothing_size')
        
    page_size = 12
    if raw_page_size and str(raw_page_size).isdigit():
        page_size = int(raw_page_size)
    elif raw_size and raw_size.isdigit():
        page_size = int(raw_size)

    search = request.args.get('search', '').strip()
    sort = request.args.get('sort', 'newest')
    page = int(request.args.get('page', 0))

    builder = (NativeSqlBuilder.create()
               .distinct(True)
               .select("p.product_id", "p.category_id", "p.brand_id", "p.name", "p.slug",
                       "p.base_price", "p.thumbnail", "p.created_at",
                       "c.name AS category_name", "b.name AS brand_name",
                       "COALESCE(SUM(pv.stock_quantity), 0) AS total_stock")
               .from_table("products", "p")
               .left_join("categories", "c", "p.category_id = c.category_id")
               .left_join("brands", "b", "p.brand_id = b.brand_id")
               .left_join("product_variants", "pv", "p.product_id = pv.product_id")
               .where("is_active", 1, "=", "p")
               .group_by("p.product_id, p.category_id, p.brand_id, p.name, p.slug, p.base_price, p.thumbnail, p.created_at, c.name, b.name"))

    if category_id:
        # Hỗ trợ lấy cả danh mục con nếu truyền category cha
        sub_cats_query = f"SELECT category_id FROM categories WHERE category_id = {int(category_id)} OR parent_id = {int(category_id)}"
        cursor.execute(sub_cats_query)
        cat_rows = cursor.fetchall()
        cat_ids = [r["category_id"] for r in cat_rows] if cat_rows else [int(category_id)]
        builder.where_in("category_id", cat_ids, "p")

    if brand_id:
        builder.where("brand_id", int(brand_id), "=", "p")

    if min_price and max_price:
        builder.where_between("base_price", float(min_price), float(max_price), "p")
    elif min_price:
        builder.where("base_price", float(min_price), ">=", "p")
    elif max_price:
        builder.where("base_price", float(max_price), "<=", "p")

    if color:
        builder.where_like("color", color, LikeMatch.EXACT, "pv")

    if clothing_size:
        builder.where_like("size", clothing_size, LikeMatch.EXACT, "pv")

    if search:
        builder.where_or_group(lambda g: g.where_like("p", "name", search, LikeMatch.CONTAINS)
                                         .where_like("p", "description", search, LikeMatch.CONTAINS)
                                         .where_like("pv", "sku", search, LikeMatch.CONTAINS))

    # Sắp xếp
    if sort == 'price_asc':
        builder.order_by_col("base_price", "ASC", "p")
    elif sort == 'price_desc':
        builder.order_by_col("base_price", "DESC", "p")
    elif sort == 'name_asc':
        builder.order_by_col("name", "ASC", "p")
    else:
        builder.order_by_col("product_id", "DESC", "p")

    result = builder.fetch_page(cursor, page, page_size)
    return api_success(result, code="PRODUCTS_FETCHED")


@catalog_bp.route('/api/products/new-arrivals', methods=['GET'])
def get_new_arrivals():
    limit = int(request.args.get('limit', 8))
    cursor = get_cursor()
    builder = (NativeSqlBuilder.create()
               .select("p.product_id", "p.name", "p.slug", "p.base_price", "p.thumbnail", "c.name AS category_name", "b.name AS brand_name")
               .from_table("products", "p")
               .left_join("categories", "c", "p.category_id = c.category_id")
               .left_join("brands", "b", "p.brand_id = b.brand_id")
               .where("is_active", 1, "=", "p")
               .order_by_col("product_id", "DESC", "p")
               .paginate(0, limit))
    return api_success(builder.fetch(cursor), code="NEW_ARRIVALS_FETCHED")


@catalog_bp.route('/api/products/featured', methods=['GET'])
def get_featured_products():
    limit = int(request.args.get('limit', 8))
    cursor = get_cursor()
    # Lấy các sản phẩm có doanh số bán cao hoặc mới nhất
    builder = (NativeSqlBuilder.create()
               .select("p.product_id", "p.name", "p.slug", "p.base_price", "p.thumbnail",
                       "c.name AS category_name", "b.name AS brand_name",
                       "COALESCE(AVG(pr.rating), 5.0) AS avg_rating",
                       "COUNT(pr.review_id) AS total_reviews")
               .from_table("products", "p")
               .left_join("categories", "c", "p.category_id = c.category_id")
               .left_join("brands", "b", "p.brand_id = b.brand_id")
               .left_join("product_reviews", "pr", "p.product_id = pr.product_id")
               .where("is_active", 1, "=", "p")
               .group_by("p.product_id, p.name, p.slug, p.base_price, p.thumbnail, c.name, b.name")
               .order_by("avg_rating DESC, p.product_id DESC")
               .paginate(0, limit))
    return api_success(builder.fetch(cursor), code="FEATURED_PRODUCTS_FETCHED")


@catalog_bp.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    cursor = get_cursor()

    # 1. Thông tin sản phẩm chính
    prod_builder = (NativeSqlBuilder.create()
                    .select("p.product_id", "p.category_id", "p.brand_id", "p.name", "p.slug",
                            "p.description", "p.base_price", "p.thumbnail", "p.created_at",
                            "c.name AS category_name", "c.slug AS category_slug",
                            "b.name AS brand_name", "b.slug AS brand_slug", "b.logo_url AS brand_logo")
                    .from_table("products", "p")
                    .left_join("categories", "c", "p.category_id = c.category_id")
                    .left_join("brands", "b", "p.brand_id = b.brand_id")
                    .where("product_id", product_id, "=", "p")
                    .where("is_active", 1, "=", "p"))
    product = prod_builder.fetch_one(cursor)
    if not product:
        return api_error("Không tìm thấy sản phẩm", code="PRODUCT_NOT_FOUND", status=404)

    # 2. Bộ sưu tập ảnh slider
    img_builder = (NativeSqlBuilder.create()
                   .select("image_id", "image_url", "sort_order")
                   .from_table("product_images", "pi")
                   .where("product_id", product_id, "=", "pi")
                   .order_by_col("sort_order", "ASC", "pi"))
    images = img_builder.fetch(cursor)
    if not images and product.get("thumbnail"):
        images = [{"image_id": 0, "image_url": product["thumbnail"], "sort_order": 0}]

    # 3. Danh sách biến thể (Size, Color, SKU, Price, Stock)
    var_builder = (NativeSqlBuilder.create()
                   .select("variant_id", "sku", "color", "size", "price", "stock_quantity")
                   .from_table("product_variants", "pv")
                   .where("product_id", product_id, "=", "pv")
                   .order_by_col("color", "ASC", "pv")
                   .order_by_col("size", "ASC", "pv"))
    variants = var_builder.fetch(cursor)

    # 4. Trích xuất danh sách màu sắc và kích cỡ khả dụng
    available_colors = sorted(list({v["color"] for v in variants if v["color"]}))
    available_sizes = sorted(list({v["size"] for v in variants if v["size"]}))

    # 5. Đánh giá trung bình
    rev_builder = (NativeSqlBuilder.create()
                   .select("COALESCE(AVG(rating), 5.0) AS avg_rating", "COUNT(1) AS review_count")
                   .from_table("product_reviews", "pr")
                   .where("product_id", product_id, "=", "pr"))
    rev_stat = rev_builder.fetch_one(cursor)

    product["images"] = images
    product["variants"] = variants
    product["available_colors"] = available_colors
    product["available_sizes"] = available_sizes
    product["rating"] = round(float(rev_stat["avg_rating"]), 1) if rev_stat else 5.0
    product["review_count"] = int(rev_stat["review_count"]) if rev_stat else 0

    return api_success(product, code="PRODUCT_DETAIL_FETCHED")


@catalog_bp.route('/api/variants/<int:variant_id>', methods=['GET'])
def get_variant_detail(variant_id):
    """Lấy thông tin chi tiết của biến thể sản phẩm phục vụ Mua ngay (Buy Now)."""
    cursor = get_cursor()
    builder = (NativeSqlBuilder.create()
               .select("pv.variant_id", "pv.product_id", "pv.sku", "pv.color", "pv.size", "pv.price", "pv.stock_quantity",
                       "p.name AS product_name", "p.thumbnail")
               .from_table("product_variants", "pv")
               .inner_join("products", "p", "pv.product_id = p.product_id")
               .where("variant_id", variant_id, "=", "pv"))
    variant = builder.fetch_one(cursor)
    if not variant:
        return api_error("Không tìm thấy biến thể sản phẩm", code="VARIANT_NOT_FOUND", status=404)
    return api_success(variant, code="VARIANT_DETAIL_FETCHED")


# =============================================================================
# 4. ADMIN PRODUCT & VARIANT MANAGEMENT
# =============================================================================

@catalog_bp.route('/api/admin/products', methods=['GET'])
@admin_required
def admin_get_products():
    cursor = get_cursor()
    page = int(request.args.get('page', 0))
    size = int(request.args.get('size', 10))
    search = request.args.get('search', '').strip()

    builder = (NativeSqlBuilder.create()
               .select("p.product_id", "p.name", "p.slug", "p.base_price", "p.thumbnail", "p.is_active",
                       "p.created_at", "c.name AS category_name", "b.name AS brand_name",
                       "COUNT(pv.variant_id) AS variant_count",
                       "COALESCE(SUM(pv.stock_quantity), 0) AS total_stock")
               .from_table("products", "p")
               .left_join("categories", "c", "p.category_id = c.category_id")
               .left_join("brands", "b", "p.brand_id = b.brand_id")
               .left_join("product_variants", "pv", "p.product_id = pv.product_id")
               .group_by("p.product_id, p.name, p.slug, p.base_price, p.thumbnail, p.is_active, p.created_at, c.name, b.name"))

    if search:
        builder.where_or_group(lambda g: g.where_like("p", "name", search, LikeMatch.CONTAINS)
                                         .where_like("c", "name", search, LikeMatch.CONTAINS)
                                         .where_like("b", "name", search, LikeMatch.CONTAINS))

    builder.order_by_col("product_id", "DESC", "p")
    result = builder.fetch_page(cursor, page, size)
    return api_success(result, code="ADMIN_PRODUCTS_FETCHED")


@catalog_bp.route('/api/admin/products', methods=['POST'])
@admin_required
def admin_create_product():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    category_id = data.get("category_id")
    brand_id = data.get("brand_id")
    base_price = data.get("base_price", 0)
    description = data.get("description", "")
    thumbnail = data.get("thumbnail", "")
    slug = data.get("slug", "").strip() or slugify(name)
    images = data.get("images", [])  # list of URLs
    variants = data.get("variants", [])  # list of dicts: {sku, color, size, price, stock_quantity}

    if not name or not category_id:
        return api_error("Vui lòng nhập tên sản phẩm và chọn danh mục", code="PRODUCT_MISSING_REQUIRED_FIELDS", status=400)

    cursor = get_cursor()

    # Tạo sản phẩm cha bằng NativeSqlBuilder
    ins_prod = (NativeSqlBuilder.insert("products")
                .values({
                    "category_id": category_id,
                    "brand_id": brand_id if brand_id else None,
                    "name": name,
                    "slug": slug,
                    "description": description,
                    "base_price": base_price,
                    "thumbnail": thumbnail,
                    "is_active": True
                }))
    product_id = ins_prod.execute_insert(cursor)

    # Thêm ảnh phụ
    if images:
        for idx, img_url in enumerate(images):
            if img_url:
                (NativeSqlBuilder.insert("product_images")
                 .values({
                     "product_id": product_id,
                     "image_url": img_url,
                     "sort_order": idx
                 })
                 .execute_insert(cursor))

    # Thêm biến thể
    if variants:
        for v in variants:
            sku = v.get("sku") or f"{slug[:10]}-{v.get('color', '')[:3]}-{v.get('size', '')}".upper()
            (NativeSqlBuilder.insert("product_variants")
             .values({
                 "product_id": product_id,
                 "sku": sku,
                 "color": v.get("color", "Tiêu chuẩn"),
                 "size": v.get("size", "Free"),
                 "price": v.get("price", base_price),
                 "stock_quantity": v.get("stock_quantity", 0)
             })
             .execute_insert(cursor))
    else:
        # Tạo biến thể mặc định nếu không khai báo
        default_sku = f"{slug[:15].upper()}-STD"
        (NativeSqlBuilder.insert("product_variants")
         .values({
             "product_id": product_id,
             "sku": default_sku,
             "color": "Tiêu chuẩn",
             "size": "Freesize",
             "price": base_price,
             "stock_quantity": 100
         })
         .execute_insert(cursor))

    return api_success({"product_id": product_id}, message="Thêm sản phẩm thành công", code="PRODUCT_CREATED", status=201)


@catalog_bp.route('/api/admin/products/<int:product_id>', methods=['PUT'])
@admin_required
def admin_update_product(product_id):
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    category_id = data.get("category_id")
    brand_id = data.get("brand_id")
    base_price = data.get("base_price")
    description = data.get("description")
    thumbnail = data.get("thumbnail")
    is_active = data.get("is_active", True)
    variants = data.get("variants")
    images = data.get("images")

    cursor = get_cursor()
    (NativeSqlBuilder.update_table("products")
     .set({
         "name": name,
         "category_id": category_id,
         "brand_id": brand_id if brand_id else None,
         "base_price": base_price,
         "description": description,
         "thumbnail": thumbnail,
         "is_active": is_active
     })
     .where("product_id", product_id)
     .execute_update(cursor))

    # Cập nhật ảnh phụ nếu có
    if images is not None:
        (NativeSqlBuilder.delete("product_images")
         .where("product_id", product_id)
         .execute_delete(cursor))
        for idx, img_url in enumerate(images):
            if img_url:
                (NativeSqlBuilder.insert("product_images")
                 .values({
                     "product_id": product_id,
                     "image_url": img_url,
                     "sort_order": idx
                 })
                 .execute_insert(cursor))

    # Cập nhật biến thể nếu có
    if variants is not None:
        for v in variants:
            if v.get("variant_id"):
                (NativeSqlBuilder.update_table("product_variants")
                 .set({
                     "sku": v.get("sku"),
                     "color": v.get("color"),
                     "size": v.get("size"),
                     "price": v.get("price"),
                     "stock_quantity": v.get("stock_quantity")
                 })
                 .where("variant_id", v.get("variant_id"))
                 .where("product_id", product_id)
                 .execute_update(cursor))
            else:
                sku = v.get("sku") or f"SKU-{product_id}-{v.get('color', '')[:2]}-{v.get('size', '')}".upper()
                (NativeSqlBuilder.insert("product_variants")
                 .values({
                     "product_id": product_id,
                     "sku": sku,
                     "color": v.get("color"),
                     "size": v.get("size"),
                     "price": v.get("price", base_price),
                     "stock_quantity": v.get("stock_quantity", 0)
                 })
                 .execute_insert(cursor))

    return api_success(message="Cập nhật sản phẩm thành công", code="PRODUCT_UPDATED")


@catalog_bp.route('/api/admin/products/<int:product_id>', methods=['DELETE'])
@admin_required
def admin_delete_product(product_id):
    cursor = get_cursor()
    (NativeSqlBuilder.update_table("products", {"is_active": False})
     .where("product_id", product_id)
     .execute_update(cursor))
    return api_success(message="Đã ẩn sản phẩm", code="PRODUCT_DELETED")
