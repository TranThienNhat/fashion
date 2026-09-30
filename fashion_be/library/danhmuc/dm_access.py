from library.db_connection import get_db, get_results, row_to_dict
import pyodbc

class Category:

    def lay_tat_ca(self):
        db = get_db()
        if db is None: return None
        try:
            cursor = db.cursor()
            cursor.execute("SELECT id, ten_danh_muc FROM DanhMuc ORDER BY id DESC")
            ket_qua = cursor.fetchall()

            # CHuyển từng dòng DB -> dict
            ds = [
                {"id": row.id, "ten_danh_muc": row.ten_danh_muc}
                for row in ket_qua
            ]
            return ds
        except Exception as e:
            print("lỗi khi lấy danh mục:", e)
            return None
        finally:
            cursor.close()

    #Thêm danh mục
    def them_danh_muc(self, ten_danh_muc):
        db = get_db()
        if not db: return None
        try:
            cursor = db.cursor()
            cursor.execute("INSERT INTO DanhMuc (ten_danh_muc) OUTPUT INSERTED.id VALUES (?)", (ten_danh_muc,))
            new_id = cursor.fetchone()[0] #ID mới được tạo
            db.commit()
            return new_id
        except Exception as e:
            print("Lỗi khi thêm danh mục:", e)
            db.rollback()
            return None
        finally:
            cursor.close()

    #Sửa danh mục
    def sua_danh_muc(self, id, ten_moi):
        db = get_db()
        if not db: return None
        try:
            cursor = db.cursor()
            cursor.execute("UPDATE DanhMuc SET ten_danh_muc = ? WHERE id = ?", (ten_moi, id))
            db.commit()
            return cursor.rowcount > 0 #True nếu có dòng bị ảnh hưởng
        except Exception as e:
            print("Lỗi khi sửa danh mục:", e)
            db.rollback()
            return False
        finally:
            cursor.close()

    #Xóa danh mục
    def xoa(self, id):
        db = get_db()
        if not db: return False
        try: 
            cursor = db.cursor()
            cursor.execute("DELETE FROM DanhMuc WHERE id = ?", (id,))
            db.commit()
            return cursor.rowcount > 0 
        except Exception as e:
            print("Lỗi khi xóa danh mục:", e)
            db.rollback()
            return False
        finally:
            cursor.close()