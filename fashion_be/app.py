# app.py - Fashion E-Commerce Backend
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Import các Blueprint module của Fashion E-Commerce
from library.nguoidung.nguoi_dung import nguoi_dung
from library.catalog.catalog_routes import catalog_bp
from library.giohang.gio_hang import gio_hang
from library.donhang.don_hang import don_hang
from library.warehouse.warehouse_routes import warehouse_bp
from library.review_blog.review_blog_routes import review_blog_bp
from library.report.report_routes import report_bp
from library.upload.upload import upload_bp

# Import hàm đóng DB
from library.db_connection import close_db
from library.common.response import api_error, api_success

load_dotenv()

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_url_path="/uploads", static_folder=UPLOAD_FOLDER)

# Cấu hình CORS mở rộng cho tất cả các route
CORS(app, resources={r"/*": {"origins": "*"}})

# Đảm bảo kết nối DB luôn được đóng sau mỗi request
app.teardown_appcontext(close_db)

# Đăng ký route phục vụ ảnh tĩnh
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# Healthcheck
@app.route('/', methods=['GET'])
def healthcheck():
    return api_success({
        "status": "Online",
        "service": "Fashion E-Commerce API",
        "version": "2.0.0",
        "database": "MySQL (fashiondb)",
        "query_engine": "NativeSqlBuilder"
    }, code="SYSTEM_HEALTH_OK", message="Hệ thống Fashion E-Commerce Backend đang hoạt động bình thường")

# Xử lý lỗi toàn cục chuẩn mã hệ thống
@app.errorhandler(404)
def handle_404(e):
    return api_error("Đường dẫn hoặc tài nguyên không tồn tại", code="RESOURCE_NOT_FOUND", status=404)

@app.errorhandler(405)
def handle_405(e):
    return api_error("Phương thức HTTP không được hỗ trợ trên tài nguyên này", code="METHOD_NOT_ALLOWED", status=405)

@app.errorhandler(500)
def handle_500(e):
    return api_error("Lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên", code="INTERNAL_SERVER_ERROR", status=500)

# Đăng ký các Blueprint
app.register_blueprint(nguoi_dung)
app.register_blueprint(catalog_bp)
app.register_blueprint(gio_hang)
app.register_blueprint(don_hang)
app.register_blueprint(warehouse_bp)
app.register_blueprint(review_blog_bp)
app.register_blueprint(report_bp)
app.register_blueprint(upload_bp)

if __name__ == '__main__':
    # Chạy trên port 5000
    app.run(host="0.0.0.0", port=5000, debug=True)