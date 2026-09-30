from flask import Blueprint, request, jsonify, send_from_directory, url_for
from library.tintuc.tin_tuc_access import TinTucRepository
from werkzeug.utils import secure_filename
import os

tin_tuc = Blueprint("tin_tuc", __name__)
tt_repo = TinTucRepository()

UPLOAD_FOLDER = "uploads"
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif"}

# Lấy tất cả tin tức
@tin_tuc.route("/tintuc", methods=["GET"])
def lay_tat_ca():
    """Lấy danh sách tất cả tin tức."""
    ds_tin_tuc = tt_repo.lay_tat_ca()
    
    if ds_tin_tuc is None:
        return jsonify({"error": "Không thể lấy danh sách tin tức"}), 500
    
    return jsonify(ds_tin_tuc), 200

# Lấy tin tức theo ID
@tin_tuc.route("/tintuc/<int:ma_tin_tuc>", methods=["GET"])
def lay_theo_id(ma_tin_tuc):
    """Lấy chi tiết tin tức theo ID."""
    tin_tuc_item = tt_repo.lay_theo_id(ma_tin_tuc)
    
    if tin_tuc_item is None:
        return jsonify({"error": "Không tìm thấy tin tức"}), 404
    
    return jsonify(tin_tuc_item), 200

# Thêm tin tức mới
@tin_tuc.route("/tintuc", methods=["POST"])
def them_tin_tuc():
    """Thêm tin tức mới."""
    tieu_de = request.form.get("tieu_de")
    noi_dung = request.form.get("noi_dung")
    file = request.files.get("hinh_anh")
    
    if not tieu_de:
        return jsonify({"error": "Thiếu tiêu đề"}), 400
    
    # Xử lý upload ảnh
    hinh_anh = None
    if file and file.filename != "":
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXT:
            return jsonify({"error": "File ảnh không hợp lệ"}), 400
        
        filename = secure_filename(file.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        hinh_anh = filename
    
    new_id = tt_repo.them_tin_tuc(tieu_de, noi_dung, hinh_anh)
    
    if new_id:
        return jsonify({
            "message": "Thêm tin tức thành công",
            "id": new_id
        }), 201
    else:
        return jsonify({"error": "Không thể thêm tin tức"}), 500

# Sửa tin tức
@tin_tuc.route("/tintuc/<int:ma_tin_tuc>", methods=["PUT"])
def sua_tin_tuc(ma_tin_tuc):
    """Cập nhật tin tức."""
    tieu_de = request.form.get("tieu_de")
    noi_dung = request.form.get("noi_dung")
    noi_bat = request.form.get("noi_bat", "0") == "1"
    file = request.files.get("hinh_anh")
    
    # Xử lý upload ảnh
    hinh_anh = None
    if file and file.filename != "":
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ALLOWED_EXT:
            return jsonify({"error": "File ảnh không hợp lệ"}), 400
        
        filename = secure_filename(file.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        hinh_anh = filename
    
    if tt_repo.sua_tin_tuc(ma_tin_tuc, tieu_de, noi_dung, hinh_anh, noi_bat):
        return jsonify({"message": "Cập nhật tin tức thành công"}), 200
    else:
        return jsonify({"error": "Không thể cập nhật tin tức"}), 404

# Xóa tin tức
@tin_tuc.route("/tintuc/<int:ma_tin_tuc>", methods=["DELETE"])
def xoa_tin_tuc(ma_tin_tuc):
    """Xóa tin tức."""
    if tt_repo.xoa_tin_tuc(ma_tin_tuc):
        return jsonify({"message": "Xóa tin tức thành công"}), 200
    else:
        return jsonify({"error": "Không thể xóa tin tức"}), 404

# Lấy tin tức nổi bật
@tin_tuc.route("/tintuc/noibat", methods=["GET"])
def lay_tin_tuc_noi_bat():
    """Lấy tin tức nổi bật."""
    try:
        limit = request.args.get('limit', 3, type=int)
        tin_tucs = tt_repo.lay_noi_bat(limit)
        return jsonify(tin_tucs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
