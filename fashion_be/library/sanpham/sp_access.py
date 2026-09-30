from library.db_connection import get_db, get_results, row_to_dict
import pyodbc

class ProductRepository:
    
    def lay_tat_ca(self):
        """Lấy tất cả sản phẩm (chỉ lấy sản phẩm chưa xóa và không bị ẩn)."""
        db = get_db()
        if db is None: return None # Trả về None nếu không kết nối được
        
        try:
            lenh = "SELECT id, ten_san_pham, gia, mo_ta, thong_so_ky_thuat, hinh_anh, noi_bat, so_luong, an FROM SanPham WHERE da_xoa = 0 AND an = 0 ORDER BY id DESC"
            cursor = db.cursor()
            cursor.execute(lenh)
        
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_sp = [dict(zip(columns, row)) for row in ket_qua]
            
            # Thêm URL ảnh đầy đủ
            for sp in ds_sp:
                if sp.get('hinh_anh'):
                    sp['hinh_anh_url'] = f"http://localhost:5000/uploads/{sp['hinh_anh']}"
            
            return ds_sp
        except pyodbc.Error as e:
            print(f"SELECT error: {e}")
            return None
        finally:
            cursor.close()

    def lay_tat_ca_admin(self):
        """Lấy tất cả sản phẩm cho admin (bao gồm cả sản phẩm bị ẩn)."""
        db = get_db()
        if db is None: return None
        
        try:
            lenh = "SELECT id, ten_san_pham, gia, mo_ta, thong_so_ky_thuat, hinh_anh, noi_bat, so_luong, an, da_xoa FROM SanPham WHERE da_xoa = 0 ORDER BY id DESC"
            cursor = db.cursor()
            cursor.execute(lenh)
        
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_sp = [dict(zip(columns, row)) for row in ket_qua]
            
            # Thêm URL ảnh đầy đủ
            for sp in ds_sp:
                if sp.get('hinh_anh'):
                    sp['hinh_anh_url'] = f"http://localhost:5000/uploads/{sp['hinh_anh']}"
            
            return ds_sp
        except pyodbc.Error as e:
            print(f"SELECT error: {e}")
            return None
        finally:
            cursor.close()

    def lay_theo_id(self, ma_san_pham):
        """Lấy sản phẩm theo ID (chỉ lấy sản phẩm chưa xóa và không bị ẩn)."""
        db = get_db()
        if db is None: return None

        try:
            # Dùng placeholder (?) để tránh SQL Injection
            lenh = "SELECT id, ten_san_pham, gia, mo_ta, thong_so_ky_thuat, hinh_anh, so_luong, an FROM SanPham WHERE id = ? AND da_xoa = 0 AND an = 0"
            cursor = db.cursor()
            cursor.execute(lenh, (ma_san_pham,)) 
        
            row = cursor.fetchone()
            if not row:
                return None
            columns = [col[0] for col in cursor.description]
            sp = dict(zip(columns, row))
            return sp
        except pyodbc.Error as e:
            print(f"SELECT error: {e}")
            return None
        finally:
            cursor.close()


    def them_san_pham(self, ten_san_pham, gia, mo_ta=None, thong_so_ky_thuat=None, hinh_anh=None, noi_bat=False, so_luong=0, danh_muc_ids=None, hinh_anh_list=None):
        """Thêm sản phẩm mới và trả về ID được tạo."""
        db = get_db()
        if db is None: return None

        try:
            cursor = db.cursor()
            
            # Thêm sản phẩm mới - không dùng OUTPUT vì có trigger
            cursor.execute(
                """
                INSERT INTO SanPham (ten_san_pham, gia, mo_ta, thong_so_ky_thuat, hinh_anh, noi_bat, so_luong) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (ten_san_pham, gia, mo_ta, thong_so_ky_thuat, hinh_anh, noi_bat, so_luong))
            
            # Lấy ID vừa được tạo
            cursor.execute("SELECT @@IDENTITY")
            ma_san_pham = cursor.fetchone()[0]
            print(f"DEBUG: Created product with ID: {ma_san_pham}")
            
            # Lưu nhiều ảnh vào bảng SanPham_HinhAnh
            if hinh_anh_list and len(hinh_anh_list) > 0:
                for idx, img in enumerate(hinh_anh_list):
                    cursor.execute(
                        "INSERT INTO SanPham_HinhAnh (san_pham_id, hinh_anh, thu_tu) VALUES (?, ?, ?)",
                        (ma_san_pham, img, idx)
                    )
                    print(f"DEBUG: Saved image {idx + 1}: {img}")
            
            #Ghi liên kết sản phẩm với các danh mục
            if danh_muc_ids and len(danh_muc_ids) > 0:
                print(f"DEBUG: Linking categories: {danh_muc_ids}")
                for danh_muc_id in danh_muc_ids:
                    cursor.execute(
                        "INSERT INTO Danhmuc_Sanpham (san_pham_id, danh_muc_id) VALUES (?, ?)",
                        (ma_san_pham, danh_muc_id)
                    )
                    print(f"DEBUG: Linked product {ma_san_pham} with category {danh_muc_id}")
            else:
                print(f"DEBUG: No categories to link (danh_muc_ids={danh_muc_ids})")
            
            db.commit()
            return ma_san_pham
        except pyodbc.Error as e:
            db.rollback()
            print(f"INSERT error: {e}")
            return None
        finally:
            cursor.close()

    def sua_san_pham(self, ma_san_pham, ten_san_pham, gia, mo_ta=None, thong_so_ky_thuat=None, hinh_anh=None, noi_bat=False, so_luong=None, danh_muc_ids=None, hinh_anh_list=None):
        """Cập nhật thông tin sản phẩm."""
        db = get_db()
        if db is None:
            return False
    
        try: 
            cursor = db.cursor()
            
            # Cập nhật thông tin sản phẩm
            if hinh_anh and so_luong is not None:
                lenh = "UPDATE SanPham SET ten_san_pham = ?, gia = ?, mo_ta = ?, thong_so_ky_thuat = ?, hinh_anh = ?, noi_bat = ?, so_luong = ? WHERE id = ?"
                cursor.execute(lenh, (ten_san_pham, gia, mo_ta, thong_so_ky_thuat, hinh_anh, noi_bat, so_luong, ma_san_pham))
            elif hinh_anh:
                lenh = "UPDATE SanPham SET ten_san_pham = ?, gia = ?, mo_ta = ?, thong_so_ky_thuat = ?, hinh_anh = ?, noi_bat = ? WHERE id = ?"
                cursor.execute(lenh, (ten_san_pham, gia, mo_ta, thong_so_ky_thuat, hinh_anh, noi_bat, ma_san_pham))
            elif so_luong is not None:
                lenh = "UPDATE SanPham SET ten_san_pham = ?, gia = ?, mo_ta = ?, thong_so_ky_thuat = ?, noi_bat = ?, so_luong = ? WHERE id = ?"
                cursor.execute(lenh, (ten_san_pham, gia, mo_ta, thong_so_ky_thuat, noi_bat, so_luong, ma_san_pham))
            else:
                lenh = "UPDATE SanPham SET ten_san_pham = ?, gia = ?, mo_ta = ?, thong_so_ky_thuat = ?, noi_bat = ? WHERE id = ?"
                cursor.execute(lenh, (ten_san_pham, gia, mo_ta, thong_so_ky_thuat, noi_bat, ma_san_pham))
            
            # Cập nhật nhiều ảnh nếu có
            if hinh_anh_list and len(hinh_anh_list) > 0:
                # Xóa ảnh cũ
                cursor.execute("DELETE FROM SanPham_HinhAnh WHERE san_pham_id = ?", (ma_san_pham,))
                # Thêm ảnh mới
                for idx, img in enumerate(hinh_anh_list):
                    cursor.execute(
                        "INSERT INTO SanPham_HinhAnh (san_pham_id, hinh_anh, thu_tu) VALUES (?, ?, ?)",
                        (ma_san_pham, img, idx)
                    )
            
            # Xóa tất cả liên kết danh mục cũ
            cursor.execute("DELETE FROM Danhmuc_Sanpham WHERE san_pham_id = ?", (ma_san_pham,))
            
            # Tạo liên kết mới với các danh mục
            if danh_muc_ids and len(danh_muc_ids) > 0:
                for danh_muc_id in danh_muc_ids:
                    cursor.execute(
                        "INSERT INTO Danhmuc_Sanpham (san_pham_id, danh_muc_id) VALUES (?, ?)",
                        (ma_san_pham, danh_muc_id)
                    )
            
            db.commit()
            return True
        except pyodbc.Error as e:
            db.rollback()
            print(f"Update error: {e}")
            return False
        finally:
            cursor.close()

    def xoa_san_pham(self, ma_san_pham):
        """Xóa mềm sản phẩm theo ID - Đánh dấu da_xoa = 1"""
        db = get_db()
        if db is None:
            return False
        try:
            cursor = db.cursor()
            
            # Kiểm tra sản phẩm có tồn tại và chưa bị xóa không
            cursor.execute(
                "SELECT da_xoa FROM SanPham WHERE id = ?",
                (ma_san_pham,)
            )
            row = cursor.fetchone()
            
            if not row:
                print(f"Product {ma_san_pham} not found")
                return False
            
            if row[0] == 1:
                print(f"Product {ma_san_pham} already deleted")
                return False
            
            # Đánh dấu sản phẩm đã xóa (soft delete)
            lenh = "UPDATE SanPham SET da_xoa = 1 WHERE id = ?"
            cursor.execute(lenh, (ma_san_pham,))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Delete error: {e}")
            return False
        finally:
            cursor.close()
    
    def lay_danh_muc_san_pham(self, ma_san_pham):
        """Lấy danh sách danh mục của sản phẩm"""
        db = get_db()
        if db is None:
            return []
        
        try:
            cursor = db.cursor()
            lenh = """
                SELECT dm.id, dm.ten_danh_muc 
                FROM DanhMuc dm
                INNER JOIN Danhmuc_Sanpham dsp ON dm.id = dsp.danh_muc_id
                WHERE dsp.san_pham_id = ?
            """
            cursor.execute(lenh, (ma_san_pham,))
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            danh_mucs = [dict(zip(columns, row)) for row in ket_qua]
            return danh_mucs
        except pyodbc.Error as e:
            print(f"SELECT error: {e}")
            return []
        finally:
            cursor.close()
    
    def lay_noi_bat(self, limit=8):
        """Lấy sản phẩm nổi bật (chỉ lấy sản phẩm chưa xóa và không bị ẩn)."""
        db = get_db()
        if db is None: return []
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT TOP (?) id, ten_san_pham, gia, mo_ta, hinh_anh, so_luong
                FROM SanPham 
                WHERE noi_bat = 1 AND da_xoa = 0 AND an = 0
                ORDER BY id DESC
            """, (limit,))
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_sp = []
            for row in ket_qua:
                sp = dict(zip(columns, row))
                if sp.get('hinh_anh'):
                    sp['hinh_anh_url'] = f"http://localhost:5000/uploads/{sp['hinh_anh']}"
                ds_sp.append(sp)
            return ds_sp
        except pyodbc.Error as e:
            print(f"SELECT error: {e}")
            return []
        finally:
            cursor.close()
    
    def lay_hinh_anh(self, ma_san_pham):
        """Lấy danh sách ảnh của sản phẩm."""
        db = get_db()
        if db is None: return []
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, hinh_anh, thu_tu
                FROM SanPham_HinhAnh
                WHERE san_pham_id = ?
                ORDER BY thu_tu
            """, (ma_san_pham,))
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_hinh_anh = []
            for row in ket_qua:
                img = dict(zip(columns, row))
                img['hinh_anh_url'] = f"http://localhost:5000/uploads/{img['hinh_anh']}"
                ds_hinh_anh.append(img)
            return ds_hinh_anh
        except pyodbc.Error as e:
            print(f"SELECT error: {e}")
            return []
        finally:
            cursor.close()
    def cap_nhat_so_luong(self, ma_san_pham, so_luong_moi):
        """Cập nhật số lượng sản phẩm."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("UPDATE SanPham SET so_luong = ? WHERE id = ? AND da_xoa = 0", (so_luong_moi, ma_san_pham))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Update quantity error: {e}")
            return False
        finally:
            cursor.close()

    def giam_so_luong(self, ma_san_pham, so_luong_giam):
        """Giảm số lượng sản phẩm (khi mua hàng)."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            # Kiểm tra số lượng hiện tại
            cursor.execute("SELECT so_luong FROM SanPham WHERE id = ? AND da_xoa = 0", (ma_san_pham,))
            row = cursor.fetchone()
            
            if not row:
                return False
                
            so_luong_hien_tai = row[0]
            if so_luong_hien_tai < so_luong_giam:
                return False  # Không đủ số lượng
            
            # Giảm số lượng
            so_luong_moi = so_luong_hien_tai - so_luong_giam
            cursor.execute("UPDATE SanPham SET so_luong = ? WHERE id = ?", (so_luong_moi, ma_san_pham))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Decrease quantity error: {e}")
            return False
        finally:
            cursor.close()

    def tang_so_luong(self, ma_san_pham, so_luong_tang):
        """Tăng số lượng sản phẩm (khi hủy đơn hàng)."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("UPDATE SanPham SET so_luong = so_luong + ? WHERE id = ? AND da_xoa = 0", (so_luong_tang, ma_san_pham))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Increase quantity error: {e}")
            return False
        finally:
            cursor.close()

    def kiem_tra_so_luong(self, ma_san_pham):
        """Kiểm tra số lượng sản phẩm."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("SELECT so_luong, an FROM SanPham WHERE id = ? AND da_xoa = 0", (ma_san_pham,))
            row = cursor.fetchone()
            
            if not row:
                return None
                
            return {"so_luong": row[0], "an": row[1]}
        except pyodbc.Error as e:
            print(f"Check quantity error: {e}")
            return None
        finally:
            cursor.close()