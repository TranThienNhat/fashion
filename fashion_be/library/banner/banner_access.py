from library.db_connection import get_db
import pyodbc

class BannerRepository:
    def lay_tat_ca(self):
        """Lấy tất cả banner."""
        db = get_db()
        if db is None: return []
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, tieu_de, hinh_anh, link, vi_tri, thu_tu, kich_hoat 
                FROM Banner 
                ORDER BY vi_tri, thu_tu
            """)
            rows = cursor.fetchall()
            
            banners = []
            for row in rows:
                banner = {
                    "id": row[0],
                    "tieu_de": row[1],
                    "hinh_anh": row[2],
                    "hinh_anh_url": f"http://127.0.0.1:5000/uploads/{row[2]}" if row[2] else None,
                    "link": row[3],
                    "vi_tri": row[4],
                    "thu_tu": row[5],
                    "trang_thai": row[6]  # Map kich_hoat to trang_thai for frontend
                }
                banners.append(banner)
            return banners
        except pyodbc.Error as e:
            print(f"Banner SELECT error: {e}")
            return []
        finally:
            cursor.close()
    
    def lay_theo_vi_tri(self, vi_tri):
        """Lấy banner theo vị trí (chỉ banner active)."""
        db = get_db()
        if db is None: return []
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, tieu_de, hinh_anh, link, vi_tri, thu_tu, kich_hoat 
                FROM Banner 
                WHERE vi_tri = ? AND kich_hoat = 1
                ORDER BY thu_tu
            """, (vi_tri,))
            rows = cursor.fetchall()
            
            banners = []
            for row in rows:
                banner = {
                    "id": row[0],
                    "tieu_de": row[1],
                    "hinh_anh": row[2],
                    "hinh_anh_url": f"http://127.0.0.1:5000/uploads/{row[2]}" if row[2] else None,
                    "link": row[3],
                    "vi_tri": row[4],
                    "thu_tu": row[5],
                    "trang_thai": row[6]  # Map kich_hoat to trang_thai for frontend
                }
                banners.append(banner)
            return banners
        except pyodbc.Error as e:
            print(f"Banner SELECT by position error: {e}")
            return []
        finally:
            cursor.close()
    
    def lay_theo_id(self, id):
        """Lấy chi tiết banner theo ID."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, tieu_de, hinh_anh, link, vi_tri, thu_tu, kich_hoat 
                FROM Banner 
                WHERE id = ?
            """, (id,))
            row = cursor.fetchone()
            
            if row:
                return {
                    "id": row[0],
                    "tieu_de": row[1],
                    "hinh_anh": row[2],
                    "hinh_anh_url": f"http://127.0.0.1:5000/uploads/{row[2]}" if row[2] else None,
                    "link": row[3],
                    "vi_tri": row[4],
                    "thu_tu": row[5],
                    "trang_thai": row[6]  # Map kich_hoat to trang_thai for frontend
                }
            return None
        except pyodbc.Error as e:
            print(f"Banner SELECT by ID error: {e}")
            return None
        finally:
            cursor.close()
    
    def them(self, tieu_de, hinh_anh, link, vi_tri, thu_tu, trang_thai):
        """Thêm banner mới."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                INSERT INTO Banner (tieu_de, hinh_anh, link, vi_tri, thu_tu, kich_hoat)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (tieu_de, hinh_anh, link, vi_tri, thu_tu, trang_thai))
            
            cursor.execute("SELECT @@IDENTITY")
            new_id = cursor.fetchone()[0]
            db.commit()
            return new_id
        except pyodbc.Error as e:
            db.rollback()
            print(f"Banner INSERT error: {e}")
            return None
        finally:
            cursor.close()
    
    def sua(self, id, tieu_de, hinh_anh, link, vi_tri, thu_tu, trang_thai):
        """Cập nhật banner."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            if hinh_anh:
                cursor.execute("""
                    UPDATE Banner 
                    SET tieu_de = ?, hinh_anh = ?, link = ?, vi_tri = ?, thu_tu = ?, kich_hoat = ?
                    WHERE id = ?
                """, (tieu_de, hinh_anh, link, vi_tri, thu_tu, trang_thai, id))
            else:
                cursor.execute("""
                    UPDATE Banner 
                    SET tieu_de = ?, link = ?, vi_tri = ?, thu_tu = ?, kich_hoat = ?
                    WHERE id = ?
                """, (tieu_de, link, vi_tri, thu_tu, trang_thai, id))
            
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Banner UPDATE error: {e}")
            return False
        finally:
            cursor.close()
    
    def cap_nhat_trang_thai(self, id, trang_thai):
        """Cập nhật trạng thái banner."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                UPDATE Banner 
                SET kich_hoat = ?
                WHERE id = ?
            """, (trang_thai, id))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Banner status UPDATE error: {e}")
            return False
        finally:
            cursor.close()
    
    def xoa(self, id):
        """Xóa banner."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("DELETE FROM Banner WHERE id = ?", (id,))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Banner DELETE error: {e}")
            return False
        finally:
            cursor.close()