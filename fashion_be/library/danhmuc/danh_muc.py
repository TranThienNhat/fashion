from flask import Blueprint, request, jsonify
from library.danhmuc.dm_access import Category

#Tạo blueprint cho danh mục
danh_muc = Blueprint("danh_muc", __name__)
dm_repo = Category()

# Lấy tất cả danh mục
@danh_muc.route("/danhmuc", methods=["GET"])
def lay_tat_ca():
    ds = dm_repo.lay_tat_ca()
    return jsonify(ds), 200

#THêm danh mục
@danh_muc.route("/danhmuc", methods=["POST"])
def them_danh_muc():
    data = request.get_json()
    ten = data.get("ten_danh_muc")

    if not ten:
        return jsonify({"error": "Thiếu tên danh mục"}), 400
    
    new_id = dm_repo.them_danh_muc(ten)
    if new_id:
        return jsonify({
            "Message": "Thêm danh mục thành công",
            "id": new_id
        }), 201
    else:
        return jsonify({"error": "Không thể thêm danh mục"}), 500
    
#Sửa danh mục
@danh_muc.route("/danhmuc/<int:id>", methods= ["PUT"])
def sua_danh_muc(id):
    data = request.get_json()
    ten_moi = data.get("ten_danh_muc")

    if not ten_moi:
        return jsonify({"error": "Thiếu tên danh mục mới"}), 400
    if dm_repo.sua_danh_muc(id, ten_moi):
        return jsonify({"message": "Cập nhật danh mục thành công"}), 200
    return jsonify({"error": "Không tìm thấy danh mục"}), 404

#Xóa danh mục
@danh_muc.route("/danhmuc/<int:id>", methods= ["DELETE"])
def xoa_danh_muc(id):
    if dm_repo.xoa(id):
        return jsonify({"message": "Xóa danh mục thành công"}), 200
    return jsonify({"error": "Không tìm thấy danh mục"}), 404