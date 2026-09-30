from flask import Blueprint, request, jsonify,send_from_directory, current_app, url_for
from library.sanpham.sp_access import ProductRepository
from library.db_connection import get_db
from werkzeug.utils import secure_filename
import os
san_pham = Blueprint("san_pham", __name__)
sp_repo = ProductRepository()
UPLOAD_FOLDER = "uploads" #thư mục chứa ảnh
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif"} #Định dạng hợp lệ
san_pham.config = {"UPLOAD_FOLDER": UPLOAD_FOLDER}
@san_pham.route('/', methods=['GET'])
def home():
    """Endpoint: Kiểm tra trạng thái ứng dụng."""
    return jsonify({"status": "Running", "message": "Flask Backend with pyodbc is active."})
#-------------Lấy tất cả sản phẩm----------------------
@san_pham.route('/sanpham', methods=['GET'])
def lay_tat_ca():
    """Endpoint: Lấy danh sách tất cả sản phẩm."""
    ds_sp = sp_repo.lay_tat_ca()
    
    if ds_sp is None:
        # Nếu get_db() thất bại (None), trả về lỗi kết nối
        return jsonify({"error": "Không thể kết nối hoặc truy vấn cơ sở dữ liệu."}), 500
        
    return jsonify(ds_sp), 200

#-------------Lấy tất cả sản phẩm cho admin----------------------
@san_pham.route('/admin/sanpham', methods=['GET'])
def lay_tat_ca_admin():
    """Endpoint: Lấy danh sách tất cả sản phẩm cho admin (bao gồm sản phẩm bị ẩn)."""
    ds_sp = sp_repo.lay_tat_ca_admin()
    
    if ds_sp is None:
        return jsonify({"error": "Không thể kết nối hoặc truy vấn cơ sở dữ liệu."}), 500
        
    return jsonify(ds_sp), 200
#--------------Lấy sản phẩm theo id------------------
@san_pham.route('/sanpham/<int:id>', methods=['GET'])
def lay_theo_id(id):
    """Endpoint: Lấy chi tiết sản phẩm theo ID."""
    sp = sp_repo.lay_theo_id(id)
    
    # Kiểm tra nếu lỗi do kết nối DB
    if sp is None and get_db() is None:
         return jsonify({"error": "Không thể kết nối cơ sở dữ liệu."}), 500
    
    # Kiểm tra nếu không tìm thấy sản phẩm
    if sp is None:
        return jsonify({"message": f"Sản phẩm ID {id} không tồn tại"}), 404
    
    if sp.get("hinh_anh"):
        sp["hinh_anh_url"] = url_for("san_pham.uploaded_file", filename = sp["hinh_anh"],_external =True)
    return jsonify(sp)
#===================================#
#-------Cấu hình upload ảnh -----------#

@san_pham.route('/sanpham', methods=['POST'])
def them_san_pham():
    """Endpoint: Tạo sản phẩm mới."""
    ten = request.form.get('ten_san_pham')
    gia = request.form.get('gia')
    mo_ta = request.form.get('mo_ta')
    thong_so_ky_thuat = request.form.get('thong_so_ky_thuat')
    noi_bat = request.form.get('noi_bat', '0') == '1'
    so_luong = request.form.get('so_luong', '0')
    danh_muc_ids_str = request.form.get('danh_muc_ids')

    files = request.files.getlist('hinh_anh')  # Lấy nhiều file

    # Kiểm tra dữ liệu đầu vào
    if not ten or gia is None:
        return jsonify({"error": "Thiếu dữ liệu sản phẩm"}), 400    
    try:
        gia = float(gia)
        so_luong = int(so_luong)
    except (TypeError, ValueError):
        return jsonify({"error": "Giá trị 'gia' hoặc 'so_luong' không hợp lệ"}), 400
    
    # Parse danh sách ID danh mục
    danh_muc_ids = []
    if danh_muc_ids_str:
        import json
        try:
            danh_muc_ids = json.loads(danh_muc_ids_str)
            print(f"DEBUG: Parsed danh_muc_ids = {danh_muc_ids}")
        except Exception as e:
            print(f"DEBUG: Error parsing danh_muc_ids: {e}")
            pass
    else:
        print("DEBUG: No danh_muc_ids received")
    
    # Xử lý upload nhiều ảnh (tối đa 5)
    hinh_anh_list = []
    if files and len(files) > 0:
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        for idx, file in enumerate(files[:5]):  # Giới hạn 5 ảnh
            if file and file.filename != "":
                ext = file.filename.rsplit('.', 1)[-1].lower()
                if ext not in ALLOWED_EXT:
                    continue
                
                # Tạo tên file unique
                import time
                filename = f"{int(time.time())}_{idx}_{secure_filename(file.filename)}"
                file.save(os.path.join(UPLOAD_FOLDER, filename))
                hinh_anh_list.append(filename)
                print(f"DEBUG: Saved image {idx + 1}: {filename}")
    
    # Ảnh đầu tiên làm ảnh chính
    hinh_anh = hinh_anh_list[0] if hinh_anh_list else None
    
    # Gọi repo để lưu DB
    new_id = sp_repo.them_san_pham(ten, gia, mo_ta, thong_so_ky_thuat, hinh_anh, noi_bat, so_luong, danh_muc_ids, hinh_anh_list)
    
    if new_id:
        return jsonify({"message": "Tạo sản phẩm thành công", "id": new_id}), 201
    else:
        return jsonify({"error": "Lỗi khi thêm sản phẩm vào DB"}), 500
    
@san_pham.route("/sanpham/<int:ma_san_pham>", methods=["PUT"])
def sua_san_pham(ma_san_pham):
    try:
        ten_san_pham = request.form.get("ten_san_pham")
        gia = request.form.get("gia")
        mo_ta = request.form.get("mo_ta")
        thong_so_ky_thuat = request.form.get("thong_so_ky_thuat")
        noi_bat = request.form.get("noi_bat", "0") == "1"
        so_luong = request.form.get("so_luong")
        danh_muc_ids_str = request.form.get("danh_muc_ids")
        
        # Parse danh sách ID danh mục
        danh_muc_ids = []
        if danh_muc_ids_str:
            import json
            try:
                danh_muc_ids = json.loads(danh_muc_ids_str)
            except:
                pass
        
        # Xử lý nhiều ảnh
        files = request.files.getlist("hinh_anh")
        hinh_anh_list = []
        if files and len(files) > 0:
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            for idx, file in enumerate(files[:5]):
                if file and file.filename != "":
                    ext = file.filename.rsplit('.', 1)[-1].lower()
                    if ext not in ALLOWED_EXT:
                        continue
                    
                    import time
                    filename = f"{int(time.time())}_{idx}_{secure_filename(file.filename)}"
                    file.save(os.path.join(UPLOAD_FOLDER, filename))
                    hinh_anh_list.append(filename)
        
        hinh_anh = hinh_anh_list[0] if hinh_anh_list else None

        ket_qua = sp_repo.sua_san_pham(ma_san_pham, ten_san_pham, gia, mo_ta, thong_so_ky_thuat, hinh_anh, noi_bat, so_luong, danh_muc_ids, hinh_anh_list)
        if ket_qua:
            return jsonify({"message": "Cập nhật thành công"})
        else:
            return jsonify({"message": "Không tìm thấy hoặc không thay đổi dữ liệu"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# -----------------------------
# Xóa sản phẩm (soft delete)
@san_pham.route("/sanpham/<int:ma_san_pham>", methods=["DELETE"])
def xoa_san_pham(ma_san_pham):
    try:
        ket_qua = sp_repo.xoa_san_pham(ma_san_pham)
        if ket_qua:
            return jsonify({"message": "Đã xóa sản phẩm thành công"})
        else:
            return jsonify({"message": "Không thể xóa sản phẩm. Sản phẩm không tồn tại hoặc đã bị xóa trước đó."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Lấy danh mục của sản phẩm
@san_pham.route("/sanpham/<int:ma_san_pham>/danhmuc", methods=["GET"])
def lay_danh_muc_san_pham(ma_san_pham):
    try:
        danh_mucs = sp_repo.lay_danh_muc_san_pham(ma_san_pham)
        return jsonify(danh_mucs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Lấy sản phẩm nổi bật
@san_pham.route("/sanpham/noibat", methods=["GET"])
def lay_san_pham_noi_bat():
    try:
        limit = request.args.get('limit', 8, type=int)
        san_phams = sp_repo.lay_noi_bat(limit)
        return jsonify(san_phams), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Lấy danh sách ảnh của sản phẩm
@san_pham.route("/sanpham/<int:ma_san_pham>/hinhanh", methods=["GET"])
def lay_hinh_anh_san_pham(ma_san_pham):
    try:
        hinh_anhs = sp_repo.lay_hinh_anh(ma_san_pham)
        return jsonify(hinh_anhs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Cập nhật số lượng sản phẩm
@san_pham.route("/sanpham/<int:ma_san_pham>/soluong", methods=["PUT"])
def cap_nhat_so_luong(ma_san_pham):
    try:
        data = request.get_json()
        so_luong_moi = data.get('so_luong')
        
        if so_luong_moi is None:
            return jsonify({"error": "Thiếu thông tin số lượng"}), 400
            
        try:
            so_luong_moi = int(so_luong_moi)
        except (TypeError, ValueError):
            return jsonify({"error": "Số lượng không hợp lệ"}), 400
            
        ket_qua = sp_repo.cap_nhat_so_luong(ma_san_pham, so_luong_moi)
        if ket_qua:
            return jsonify({"message": "Cập nhật số lượng thành công"})
        else:
            return jsonify({"message": "Không tìm thấy sản phẩm"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Giảm số lượng sản phẩm (khi mua hàng)
@san_pham.route("/sanpham/<int:ma_san_pham>/giam-soluong", methods=["PUT"])
def giam_so_luong(ma_san_pham):
    try:
        data = request.get_json()
        so_luong_giam = data.get('so_luong', 1)
        
        try:
            so_luong_giam = int(so_luong_giam)
        except (TypeError, ValueError):
            return jsonify({"error": "Số lượng không hợp lệ"}), 400
            
        ket_qua = sp_repo.giam_so_luong(ma_san_pham, so_luong_giam)
        if ket_qua:
            return jsonify({"message": "Giảm số lượng thành công"})
        else:
            return jsonify({"message": "Không đủ số lượng hoặc sản phẩm không tồn tại"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Tăng số lượng sản phẩm (khi hủy đơn hàng)
@san_pham.route("/sanpham/<int:ma_san_pham>/tang-soluong", methods=["PUT"])
def tang_so_luong(ma_san_pham):
    try:
        data = request.get_json()
        so_luong_tang = data.get('so_luong', 1)
        
        try:
            so_luong_tang = int(so_luong_tang)
        except (TypeError, ValueError):
            return jsonify({"error": "Số lượng không hợp lệ"}), 400
            
        ket_qua = sp_repo.tang_so_luong(ma_san_pham, so_luong_tang)
        if ket_qua:
            return jsonify({"message": "Tăng số lượng thành công"})
        else:
            return jsonify({"message": "Không tìm thấy sản phẩm"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#Xư lý ảnh    
@san_pham.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
    
    