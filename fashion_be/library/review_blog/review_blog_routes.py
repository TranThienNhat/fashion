import re
import unicodedata
from flask import Blueprint, request, jsonify, g
from library.db_connection import get_cursor
from library.native_sql_builder import NativeSqlBuilder, LikeMatch
from library.auth.auth_service import token_required, admin_required
from library.common.response import api_success, api_error

review_blog_bp = Blueprint("review_blog", __name__)


def slugify(text: str) -> str:
    """Chuyển đổi chuỗi tiếng Việt thành slug chuẩn SEO."""
    if not text:
        return ""
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


# =============================================================================
# 1. ĐÁNH GIÁ SẢN PHẨM (PRODUCT REVIEWS)
# =============================================================================

@review_blog_bp.route('/api/products/<int:product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    cursor = get_cursor()
    builder = (NativeSqlBuilder.create()
               .select("pr.review_id", "pr.rating", "pr.comment", "pr.created_at",
                       "u.full_name AS user_name")
               .from_table("product_reviews", "pr")
               .inner_join("users", "u", "pr.user_id = u.user_id")
               .where("product_id", product_id, "=", "pr")
               .order_by_col("review_id", "DESC", "pr"))
    reviews = builder.fetch(cursor)
    return api_success(reviews, code="REVIEWS_FETCHED", message="Lấy danh sách đánh giá thành công")


@review_blog_bp.route('/api/reviews', methods=['POST'])
@token_required
def create_review():
    """
    Gửi đánh giá sau khi đơn hàng chuyển sang trạng thái DELIVERED.
    """
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}
    product_id = data.get("product_id")
    order_id = data.get("order_id")
    rating = int(data.get("rating", 5))
    comment = data.get("comment", "").strip()

    if not product_id or rating < 1 or rating > 5:
        return api_error(
            "Thông tin đánh giá hoặc số sao (1-5) không hợp lệ",
            code="REVIEW_INVALID_RATING",
            status=400
        )

    cursor = get_cursor()

    # Kiểm tra điều kiện: nếu kèm order_id thì đơn hàng phải thuộc về user và đã DELIVERED
    if order_id:
        chk_order = (NativeSqlBuilder.create()
                     .select("order_id", "order_status")
                     .from_table("orders", "o")
                     .where("order_id", order_id, "=", "o")
                     .where("user_id", user_id, "=", "o")
                     .fetch_one(cursor))
        if not chk_order or chk_order["order_status"] != "DELIVERED":
            return api_error(
                "Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã được giao thành công (DELIVERED)",
                code="REVIEW_ORDER_NOT_DELIVERED",
                status=400
            )

    ins_builder = (NativeSqlBuilder.insert("product_reviews")
                   .values({
                       "product_id": product_id,
                       "user_id": user_id,
                       "order_id": order_id if order_id else None,
                       "rating": rating,
                       "comment": comment
                   }))
    review_id = ins_builder.execute_insert(cursor)

    return api_success({"review_id": review_id}, message="Cảm ơn bạn đã gửi đánh giá sản phẩm!", code="REVIEW_SUBMITTED", status=201)


@review_blog_bp.route('/api/admin/reviews', methods=['GET'])
@admin_required
def admin_get_reviews():
    cursor = get_cursor()
    page = int(request.args.get('page', 0))
    size = int(request.args.get('size', 10))

    builder = (NativeSqlBuilder.create()
               .select("pr.review_id", "pr.rating", "pr.comment", "pr.created_at",
                       "p.product_id", "p.name AS product_name", "p.thumbnail",
                       "u.full_name AS user_name", "u.email AS user_email")
               .from_table("product_reviews", "pr")
               .inner_join("products", "p", "pr.product_id = p.product_id")
               .inner_join("users", "u", "pr.user_id = u.user_id")
               .order_by_col("review_id", "DESC", "pr"))

    result = builder.fetch_page(cursor, page, size)
    return api_success(result, code="ADMIN_REVIEWS_FETCHED", message="Lấy danh sách đánh giá quản trị thành công")


@review_blog_bp.route('/api/admin/reviews/<int:review_id>', methods=['DELETE'])
@admin_required
def admin_delete_review(review_id):
    cursor = get_cursor()
    del_builder = (NativeSqlBuilder.delete("product_reviews")
                   .where("review_id", review_id))
    del_builder.execute_delete(cursor)
    return api_success(message="Đã xóa đánh giá", code="REVIEW_DELETED")


# =============================================================================
# 2. TIN TỨC & BLOG THỜI TRANG (BLOG POSTS)
# =============================================================================

@review_blog_bp.route('/api/blog', methods=['GET'])
def get_blog_posts():
    """Khách xem bài viết đã xuất bản."""
    cursor = get_cursor()
    page = int(request.args.get('page', 0))
    size = int(request.args.get('size', 6))

    builder = (NativeSqlBuilder.create()
               .select("bp.post_id", "bp.title", "bp.slug", "bp.thumbnail", "bp.summary",
                       "bp.is_published", "bp.created_at", "u.full_name AS author_name")
               .from_table("blog_posts", "bp")
               .inner_join("users", "u", "bp.author_id = u.user_id")
               .where("is_published", 1, "=", "bp")
               .order_by_col("post_id", "DESC", "bp"))

    result = builder.fetch_page(cursor, page, size)
    return api_success(result, code="BLOG_POSTS_FETCHED", message="Lấy danh sách bài viết thành công")


@review_blog_bp.route('/api/admin/blog', methods=['GET'])
@admin_required
def admin_get_blog_posts():
    """Quản trị viên xem toàn bộ bài viết (cả xuất bản và bản nháp)."""
    cursor = get_cursor()
    page = int(request.args.get('page', 0))
    size = int(request.args.get('size', 10))
    search = request.args.get('search', '').strip()

    builder = (NativeSqlBuilder.create()
               .select("bp.post_id", "bp.title", "bp.slug", "bp.thumbnail", "bp.summary",
                       "bp.content", "bp.is_published", "bp.created_at", "u.full_name AS author_name")
               .from_table("blog_posts", "bp")
               .inner_join("users", "u", "bp.author_id = u.user_id"))

    if search:
        builder.where_or_group(lambda g: g.where_like("bp", "title", search, LikeMatch.CONTAINS)
                                         .where_like("bp", "summary", search, LikeMatch.CONTAINS))

    builder.order_by_col("post_id", "DESC", "bp")
    result = builder.fetch_page(cursor, page, size)
    return api_success(result, code="ADMIN_BLOG_POSTS_FETCHED", message="Lấy danh sách bài viết quản trị thành công")


@review_blog_bp.route('/api/blog/<slug>', methods=['GET'])
def get_blog_post_detail(slug):
    cursor = get_cursor()
    builder = (NativeSqlBuilder.create()
               .select("bp.*", "u.full_name AS author_name")
               .from_table("blog_posts", "bp")
               .inner_join("users", "u", "bp.author_id = u.user_id"))

    if slug.isdigit():
        builder.where_or_group(lambda g: g.where("bp", "slug", "=", slug)
                                         .where("bp", "post_id", "=", int(slug)))
    else:
        builder.where("slug", slug, "=", "bp")

    post = builder.fetch_one(cursor)
    if not post:
        return api_error("Không tìm thấy bài viết", code="BLOG_POST_NOT_FOUND", status=404)
    return api_success(post, code="BLOG_POST_DETAIL_FETCHED", message="Lấy chi tiết bài viết thành công")


@review_blog_bp.route('/api/admin/blog', methods=['POST'])
@admin_required
def admin_create_blog_post():
    user_id = g.current_user["user_id"]
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    thumbnail = data.get("thumbnail", "")
    summary = data.get("summary", "")
    content = data.get("content", "")
    slug = data.get("slug", "").strip() or slugify(title)
    if not slug:
        import time
        slug = f"post-{int(time.time())}"

    # Đảm bảo is_published chuyển thành bool / int
    raw_published = data.get("is_published", True)
    is_published = 1 if (raw_published is True or raw_published == 1 or raw_published == "true") else 0

    if not title or not content:
        return api_error("Vui lòng nhập tiêu đề và nội dung bài viết", code="BLOG_MISSING_REQUIRED_FIELDS", status=400)

    cursor = get_cursor()
    # Kiểm tra trùng slug nếu có
    existing = (NativeSqlBuilder.create()
                .select("post_id")
                .from_table("blog_posts", "bp")
                .where("slug", slug, "=", "bp")
                .fetch_one(cursor))
    if existing:
        import time
        slug = f"{slug}-{int(time.time()) % 10000}"

    ins_builder = (NativeSqlBuilder.insert("blog_posts")
                   .values({
                       "author_id": user_id,
                       "title": title,
                       "slug": slug,
                       "thumbnail": thumbnail,
                       "summary": summary,
                       "content": content,
                       "is_published": is_published
                   }))
    post_id = ins_builder.execute_insert(cursor)

    return api_success({"post_id": post_id}, message="Đăng bài viết thành công", code="BLOG_POST_CREATED", status=201)


@review_blog_bp.route('/api/admin/blog/<int:post_id>', methods=['PUT'])
@admin_required
def admin_update_blog_post(post_id):
    data = request.get_json() or {}
    cursor = get_cursor()

    # Kiểm tra bài viết tồn tại
    existing = (NativeSqlBuilder.create()
                .select("post_id", "slug", "title")
                .from_table("blog_posts", "bp")
                .where("post_id", post_id, "=", "bp")
                .fetch_one(cursor))
    if not existing:
        return api_error("Không tìm thấy bài viết", code="BLOG_POST_NOT_FOUND", status=404)

    title = data.get("title", existing["title"]).strip()
    slug = data.get("slug", "").strip() or existing["slug"]
    thumbnail = data.get("thumbnail", "")
    summary = data.get("summary", "")
    content = data.get("content", "")

    raw_published = data.get("is_published")
    if raw_published is not None:
        is_published = 1 if (raw_published is True or raw_published == 1 or raw_published == "true") else 0
    else:
        is_published = 1

    upd_builder = (NativeSqlBuilder.update_table("blog_posts")
                   .set({
                       "title": title,
                       "slug": slug,
                       "thumbnail": thumbnail,
                       "summary": summary,
                       "content": content,
                       "is_published": is_published
                   })
                   .where("post_id", post_id))
    upd_builder.execute_update(cursor)

    return api_success(message="Cập nhật bài viết thành công", code="BLOG_POST_UPDATED")


@review_blog_bp.route('/api/admin/blog/<int:post_id>/status', methods=['PUT'])
@admin_required
def admin_toggle_blog_status(post_id):
    data = request.get_json() or {}
    raw_published = data.get("is_published")
    is_published = 1 if (raw_published is True or raw_published == 1 or raw_published == "true") else 0

    cursor = get_cursor()
    upd_builder = (NativeSqlBuilder.update_table("blog_posts")
                   .set({"is_published": is_published})
                   .where("post_id", post_id))
    upd_builder.execute_update(cursor)
    return api_success(message="Cập nhật trạng thái bài viết thành công", code="BLOG_STATUS_UPDATED")


@review_blog_bp.route('/api/admin/blog/<int:post_id>', methods=['DELETE'])
@admin_required
def admin_delete_blog_post(post_id):
    cursor = get_cursor()
    del_builder = (NativeSqlBuilder.delete("blog_posts")
                   .where("post_id", post_id))
    del_builder.execute_delete(cursor)
    return api_success(message="Đã xóa bài viết", code="BLOG_POST_DELETED")
