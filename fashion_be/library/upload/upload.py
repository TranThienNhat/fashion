from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from library.common.response import api_success, api_error

load_dotenv()

upload_bp = Blueprint("upload", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXT = {"png", "jpg", "jpeg", "gif", "webp", "svg"}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT


def get_base_url():
    return os.environ.get("BASE_URL", "http://127.0.0.1:5000").rstrip("/")


# Upload 1 ảnh
@upload_bp.route("/api/upload/image", methods=["POST"])
@upload_bp.route("/upload/image", methods=["POST"])
def upload_image():
    if 'file' not in request.files:
        return api_error("Không tìm thấy file ảnh đính kèm", code="UPLOAD_FILE_MISSING", status=400)
    
    file = request.files['file']
    if not file or file.filename == '':
        return api_error("Chưa chọn file ảnh nào", code="UPLOAD_NO_FILE_SELECTED", status=400)
    
    if not allowed_file(file.filename):
        return api_error("Định dạng file không hợp lệ. Chỉ chấp nhận: png, jpg, jpeg, gif, webp, svg", code="UPLOAD_INVALID_FORMAT", status=400)
    
    try:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = uuid.uuid4().hex[:6]
        orig_name = secure_filename(file.filename) or "image"
        name, ext = os.path.splitext(orig_name)
        if not ext:
            ext = ".jpg"
        filename = f"{name}_{timestamp}_{unique_id}{ext}"
        
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        file_url = f"{get_base_url()}/uploads/{filename}"
        
        return api_success({
            "filename": filename,
            "url": file_url
        }, message="Upload ảnh thành công", code="UPLOAD_SUCCESS")
    except Exception as e:
        return api_error(f"Lỗi khi lưu file: {str(e)}", code="UPLOAD_FILE_SAVE_ERROR", status=500)


# Upload nhiều ảnh
@upload_bp.route("/api/upload/images", methods=["POST"])
@upload_bp.route("/upload/images", methods=["POST"])
def upload_images():
    if 'files' not in request.files:
        return api_error("Không tìm thấy danh sách file", code="UPLOAD_FILE_MISSING", status=400)
    
    files = request.files.getlist('files')
    if not files or len(files) == 0:
        return api_error("Chưa chọn file nào", code="UPLOAD_NO_FILE_SELECTED", status=400)
    
    uploaded = []
    errors = []
    
    for file in files:
        if not file or file.filename == '':
            continue
        if not allowed_file(file.filename):
            errors.append(f"{file.filename}: Định dạng không hợp lệ")
            continue
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = uuid.uuid4().hex[:6]
            orig_name = secure_filename(file.filename) or "image"
            name, ext = os.path.splitext(orig_name)
            if not ext:
                ext = ".jpg"
            filename = f"{name}_{timestamp}_{unique_id}{ext}"
            
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            
            file_url = f"{get_base_url()}/uploads/{filename}"
            uploaded.append({
                "filename": filename,
                "url": file_url,
                "original_name": file.filename
            })
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
            
    return api_success({
        "files": uploaded,
        "errors": errors if errors else None
    }, message=f"Upload thành công {len(uploaded)} file", code="UPLOAD_MULTIPLE_SUCCESS")


# Danh sách ảnh đã upload
@upload_bp.route("/api/upload/images", methods=["GET"])
@upload_bp.route("/upload/images", methods=["GET"])
def get_uploaded_images():
    try:
        if not os.path.exists(UPLOAD_FOLDER):
            return api_success({"images": []}, code="UPLOADED_IMAGES_FETCHED")
        
        files = []
        for filename in os.listdir(UPLOAD_FOLDER):
            if allowed_file(filename):
                file_url = f"{get_base_url()}/uploads/{filename}"
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file_stat = os.stat(filepath)
                files.append({
                    "filename": filename,
                    "url": file_url,
                    "size": file_stat.st_size,
                    "created": datetime.fromtimestamp(file_stat.st_ctime).isoformat()
                })
        files.sort(key=lambda x: x['created'], reverse=True)
        return api_success({"images": files}, code="UPLOADED_IMAGES_FETCHED")
    except Exception as e:
        return api_error(str(e), code="UPLOAD_FETCH_ERROR", status=500)
