from flask import Blueprint, request, jsonify
from library.db_connection import get_cursor
from library.native_sql_builder import NativeSqlBuilder
from library.auth.auth_service import admin_required
from library.common.response import api_success, api_error

report_bp = Blueprint("report", __name__)


@report_bp.route('/api/admin/reports/dashboard', methods=['GET'])
@admin_required
def get_dashboard_summary():
    """
    Thống kê tổng quan cho Admin Dashboard:
    - Tổng doanh thu (từ các đơn hàng khác CANCELLED)
    - Tổng chi phí nhập kho
    - Tổng số đơn hàng
    - Tổng số sản phẩm và biến thể
    - Số lượng mặt hàng sắp hết tồn kho (<= 10)
    """
    cursor = get_cursor()

    # 1. Doanh thu bán ra
    rev_builder = (NativeSqlBuilder.create()
                   .select("COALESCE(SUM(total_amount), 0) AS total_revenue", "COUNT(order_id) AS total_orders")
                   .from_table("orders", "o")
                   .where("order_status", "CANCELLED", "!=", "o"))
    rev_row = rev_builder.fetch_one(cursor) or {"total_revenue": 0, "total_orders": 0}

    # 2. Chi phí nhập kho
    cost_builder = (NativeSqlBuilder.create()
                    .select("COALESCE(SUM(total_cost), 0) AS total_import_cost", "COUNT(receipt_id) AS total_receipts")
                    .from_table("purchase_receipts", "pr"))
    cost_row = cost_builder.fetch_one(cursor) or {"total_import_cost": 0, "total_receipts": 0}

    # 3. Tổng số lượng sản phẩm & khách hàng
    total_products = (NativeSqlBuilder.create().from_table("products", "p").where("is_active", 1, "=", "p").fetch_count(cursor))
    total_customers = (NativeSqlBuilder.create().from_table("users", "u").where("role", "CUSTOMER", "=", "u").fetch_count(cursor))

    # 4. Số lượng biến thể sắp hết tồn kho (< 10)
    low_stock_count = (NativeSqlBuilder.create()
                       .from_table("product_variants", "pv")
                       .where("stock_quantity", 10, "<=", "pv")
                       .fetch_count(cursor))

    total_revenue = float(rev_row["total_revenue"])
    total_cost = float(cost_row["total_import_cost"])
    gross_profit = total_revenue - total_cost

    return api_success({
        "total_revenue": total_revenue,
        "total_import_cost": total_cost,
        "gross_profit": gross_profit,
        "total_orders": int(rev_row["total_orders"]),
        "total_receipts": int(cost_row["total_receipts"]),
        "total_products": total_products,
        "total_customers": total_customers,
        "low_stock_count": low_stock_count
    }, code="REPORTS_DASHBOARD_FETCHED", message="Lấy dữ liệu tổng quan báo cáo thành công")


@report_bp.route('/api/admin/reports/revenue-time', methods=['GET'])
@admin_required
def get_revenue_by_time():
    """
    Thống kê doanh thu theo thời gian:
    period = 'day' (theo các ngày gần nhất) hoặc 'month' (theo các tháng gần nhất)
    """
    cursor = get_cursor()
    period = request.args.get('period', 'day')

    if period == 'month':
        sql = """
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS time_label,
                   SUM(total_amount) AS revenue,
                   COUNT(order_id) AS order_count
            FROM orders
            WHERE order_status != 'CANCELLED'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY time_label ASC
            LIMIT 12
        """
    else:
        sql = """
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS time_label,
                   SUM(total_amount) AS revenue,
                   COUNT(order_id) AS order_count
            FROM orders
            WHERE order_status != 'CANCELLED'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
            ORDER BY time_label ASC
            LIMIT 30
        """

    cursor.execute(sql)
    rows = cursor.fetchall() or []
    return api_success(rows, code="REPORTS_REVENUE_TIME_FETCHED", message="Lấy thống kê doanh thu theo thời gian thành công")


@report_bp.route('/api/admin/reports/order-status', methods=['GET'])
@admin_required
def get_order_status_distribution():
    """
    Báo cáo phân bố đơn hàng theo từng trạng thái:
    PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED
    """
    cursor = get_cursor()
    builder = (NativeSqlBuilder.create()
               .select("order_status", "COUNT(1) AS count", "COALESCE(SUM(total_amount), 0) AS total_value")
               .from_table("orders", "o")
               .group_by("order_status")
               .order_by("count DESC"))
    rows = builder.fetch(cursor)
    return api_success(rows, code="REPORTS_ORDER_STATUS_FETCHED", message="Lấy phân bố trạng thái đơn hàng thành công")


@report_bp.route('/api/admin/reports/low-stock', methods=['GET'])
@admin_required
def get_low_stock_warning():
    """
    Danh sách các sản phẩm và biến thể có lượng tồn dưới ngưỡng an toàn (mặc định <= 10).
    """
    cursor = get_cursor()
    threshold = int(request.args.get('threshold', 10))

    builder = (NativeSqlBuilder.create()
               .select("pv.variant_id", "pv.sku", "pv.color", "pv.size", "pv.price", "pv.stock_quantity",
                       "p.product_id", "p.name AS product_name", "p.thumbnail",
                       "c.name AS category_name", "b.name AS brand_name")
               .from_table("product_variants", "pv")
               .inner_join("products", "p", "pv.product_id = p.product_id")
               .left_join("categories", "c", "p.category_id = c.category_id")
               .left_join("brands", "b", "p.brand_id = b.brand_id")
               .where("stock_quantity", threshold, "<=", "pv")
               .where("is_active", 1, "=", "p")
               .order_by_col("stock_quantity", "ASC", "pv"))

    items = builder.fetch(cursor)
    return api_success(items, code="REPORTS_LOW_STOCK_FETCHED", message="Lấy danh sách cảnh báo tồn kho thấp thành công")
