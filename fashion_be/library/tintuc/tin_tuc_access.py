from library.db_connection import get_db
import pyodbc

class TinTucRepository:
    
    def lay_tat_ca(self):
        """Lấy tất cả tin tức."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, tieu_de, noi_dung, hinh_anh, ngay_tao, noi_bat
                FROM TinTuc
                ORDER BY ngay_tao DESC
            """)
            
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_tin_tuc = []
            for row in ket_qua:
                tt = dict(zip(columns, row))
                if tt.get('hinh_anh'):
                    tt['hinh_anh_url'] = f"http://localhost:5000/uploads/{tt['hinh_anh']}"
                ds_tin_tuc.append(tt)
            return ds_tin_tuc
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy tin tức: {e}")
            return None
        finally:
            cursor.close()
    
    def lay_theo_id(self, ma_tin_tuc):
        """Lấy tin tức theo ID."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, tieu_de, noi_dung, hinh_anh, ngay_tao
                FROM TinTuc
                WHERE id = ?
            """, (ma_tin_tuc,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            columns = [col[0] for col in cursor.description]
            tin_tuc = dict(zip(columns, row))
            if tin_tuc.get('hinh_anh'):
                tin_tuc['hinh_anh_url'] = f"http://localhost:5000/uploads/{tin_tuc['hinh_anh']}"
            return tin_tuc
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy tin tức: {e}")
            return None
        finally:
            cursor.close()
    
    def them_tin_tuc(self, tieu_de, noi_dung, hinh_anh=None):
        """Thêm tin tức mới."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                INSERT INTO TinTuc (tieu_de, noi_dung, hinh_anh)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?)
            """, (tieu_de, noi_dung, hinh_anh))
            
            new_id = cursor.fetchone()[0]
            db.commit()
            return new_id
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi thêm tin tức: {e}")
            return None
        finally:
            cursor.close()
    
    def sua_tin_tuc(self, ma_tin_tuc, tieu_de, noi_dung, hinh_anh=None, noi_bat=False):
        """Cập nhật tin tức."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            
            if hinh_anh:
                cursor.execute("""
                    UPDATE TinTuc 
                    SET tieu_de = ?, noi_dung = ?, hinh_anh = ?, noi_bat = ?
                    WHERE id = ?
                """, (tieu_de, noi_dung, hinh_anh, noi_bat, ma_tin_tuc))
            else:
                cursor.execute("""
                    UPDATE TinTuc 
                    SET tieu_de = ?, noi_dung = ?, noi_bat = ?
                    WHERE id = ?
                """, (tieu_de, noi_dung, noi_bat, ma_tin_tuc))
            
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi cập nhật tin tức: {e}")
            return False
        finally:
            cursor.close()
    
    def xoa_tin_tuc(self, ma_tin_tuc):
        """Xóa tin tức."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("DELETE FROM TinTuc WHERE id = ?", (ma_tin_tuc,))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi xóa tin tức: {e}")
            return False
        finally:
            cursor.close()
    
    def lay_noi_bat(self, limit=3):
        """Lấy tin tức nổi bật."""
        db = get_db()
        if db is None: return []
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT TOP (?) id, tieu_de, noi_dung, hinh_anh, ngay_tao, noi_bat
                FROM TinTuc
                WHERE noi_bat = 1
                ORDER BY ngay_tao DESC
            """, (limit,))
            
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_tin_tuc = []
            for row in ket_qua:
                tt = dict(zip(columns, row))
                if tt.get('hinh_anh'):
                    tt['hinh_anh_url'] = f"http://localhost:5000/uploads/{tt['hinh_anh']}"
                ds_tin_tuc.append(tt)
            return ds_tin_tuc
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy tin tức nổi bật: {e}")
            return []
        finally:
            cursor.close()
