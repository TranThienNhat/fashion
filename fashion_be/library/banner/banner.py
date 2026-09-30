from flask import Blueprint, request, jsonify
from library.banner.banner_access import BannerRepository
from werkzeug.utils import secure_filename
import os

banner_bp = Blueprint("banner", __name__)
banner_repo = BannerRepository()

UPLOAD_FOLDER = "uploads"
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif", "webp"}

@banner_bp.route("/banner", methods=["GET"])
def lay_tat_ca():
    """Lấy tất cả banner."""
    banners = banner_repo.lay_tat_ca()
    return jsonify(banners), 200

@banner_bp.route("/banner/<int:vi_tri>", methods=["GET"])
def lay_theo_vi_tri(vi_tri):
    """Lấy banner theo vị trí (chỉ banner active)."""
    banners = banner_repo.lay_theo_vi_tri(vi_tri)
    return jsonify(banners), 200

@banner_bp.route("/banner/detail/<int:id>", methods=["GET"])
def lay_theo_id(id):
    """Lấy chi tiết banner theo ID."""
    banner = banner_repo.lay_theo_id(id)
    if banner:
        return jsonify(banner), 200
    return jsonify({"error": "Không tìm thấy banner"}), 404

@banner_bp.route("/banner", methods=["POST"])
def them_banner():
    """Thêm banner mới."""
    try:
        tieu_de = request.form.get("tieu_de", "")
        link = request.form.get("link", "")
        vi_tri = int(request.form.get("vi_tri", 1))
        thu_tu = int(request.form.get("thu_tu", 1))
        trang_thai = request.form.get("trang_thai", "1") == "1"
        
        file = request.files.get("hinh_anh")
        if not file or file.filename == "":
            return jsonify({"error": "Thiếu hình ảnh"}), 400
        
        ext = file.filename.rsplit('.', 1)[-1].lower()
        if ext not in ALLOWED_EXT:
            return jsonify({"error": "File ảnh không hợp lệ"}), 400
        
        filename = secure_filename(file.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        
        new_id = banner_repo.them(tieu_de, filename, link, vi_tri, thu_tu, trang_thai)
        if new_id:
            return jsonify({"message": "Thêm banner thành công", "id": new_id}), 201
        return jsonify({"error": "Không thể thêm banner"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@banner_bp.route("/banner/<int:id>", methods=["PUT"])
def sua_banner(id):
    """Cập nhật banner."""
    try:
        tieu_de = request.form.get("tieu_de", "")
        link = request.form.get("link", "")
        vi_tri = int(request.form.get("vi_tri", 1))
        thu_tu = int(request.form.get("thu_tu", 1))
        trang_thai = request.form.get("trang_thai", "1") == "1"
        
        file = request.files.get("hinh_anh")
        hinh_anh = None
        if file and file.filename != "":
            ext = file.filename.rsplit('.', 1)[-1].lower()
            if ext not in ALLOWED_EXT:
                return jsonify({"error": "File ảnh không hợp lệ"}), 400
            filename = secure_filename(file.filename)
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            hinh_anh = filename
        
        if banner_repo.sua(id, tieu_de, hinh_anh, link, vi_tri, thu_tu, trang_thai):
            return jsonify({"message": "Cập nhật banner thành công"}), 200
        return jsonify({"error": "Không thể cập nhật banner"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@banner_bp.route("/banner/<int:id>/trangthai", methods=["PUT"])
def cap_nhat_trang_thai(id):
    """Cập nhật trạng thái banner (hiện/ẩn)."""
    try:
        data = request.get_json()
        trang_thai = data.get("trang_thai", True)
        
        if banner_repo.cap_nhat_trang_thai(id, trang_thai):
            return jsonify({"message": "Cập nhật trạng thái thành công"}), 200
        return jsonify({"error": "Không thể cập nhật trạng thái"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@banner_bp.route("/banner/<int:id>", methods=["DELETE"])
def xoa_banner(id):
    """Xóa banner."""
    if banner_repo.xoa(id):
        return jsonify({"message": "Xóa banner thành công"}), 200
    return jsonify({"error": "Không thể xóa banner"}), 404
