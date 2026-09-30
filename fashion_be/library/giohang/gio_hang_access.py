from library.db_connection import get_db
import pyodbc

class GioHangRepository:
    
    def lay_gio_hang_theo_nguoi_dung(self, ma_nguoi_dung):
        """Lấy giỏ hàng của người dùng với chi tiết sản phẩm."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            # Lấy hoặc tạo giỏ hàng cho người dùng
            cursor.execute("SELECT id FROM GioHang WHERE ma_nguoi_dung = ?", (ma_nguoi_dung,))
            row = cursor.fetchone()
            
            if not row:
                # Tạo giỏ hàng mới nếu chưa có
                cursor.execute(
                    "INSERT INTO GioHang (ma_nguoi_dung) OUTPUT INSERTED.id VALUES (?)",
                    (ma_nguoi_dung,)
                )
                ma_gio_hang = cursor.fetchone()[0]
                db.commit()
            else:
                ma_gio_hang = row[0]
            
            # Lấy chi tiết giỏ hàng với thông tin tồn kho
            cursor.execute("""
                SELECT ct.id, ct.ma_san_pham, sp.ten_san_pham, sp.gia, 
                       ct.so_luong, (sp.gia * ct.so_luong) as thanh_tien,
                       sp.so_luong as so_luong_ton, sp.an
                FROM ChiTietGioHang ct
                JOIN SanPham sp ON ct.ma_san_pham = sp.id
                WHERE ct.ma_gio_hang = ? AND sp.da_xoa = 0
            """, (ma_gio_hang,))
            
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            chi_tiet = []
            for row in ket_qua:
                item = dict(zip(columns, row))
                # Convert Decimal to float for JSON serialization
                if 'gia' in item:
                    item['gia'] = float(item['gia'])
                if 'thanh_tien' in item:
                    item['thanh_tien'] = float(item['thanh_tien'])
                chi_tiet.append(item)
            
            return {
                "ma_gio_hang": ma_gio_hang,
                "ma_nguoi_dung": ma_nguoi_dung,
                "chi_tiet": chi_tiet
            }
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy giỏ hàng: {e}")
            return None
        finally:
            cursor.close()
    
    def them_san_pham_vao_gio(self, ma_nguoi_dung, ma_san_pham, so_luong=1):
        """Thêm sản phẩm vào giỏ hàng với kiểm tra tồn kho."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            
            # Kiểm tra tồn kho trước khi thêm
            cursor.execute("SELECT so_luong, ten_san_pham FROM SanPham WHERE id = ? AND da_xoa = 0", (ma_san_pham,))
            san_pham = cursor.fetchone()
            
            if not san_pham:
                raise Exception("Sản phẩm không tồn tại")
            
            so_luong_ton, ten_san_pham = san_pham
            
            # Lấy hoặc tạo giỏ hàng
            cursor.execute("SELECT id FROM GioHang WHERE ma_nguoi_dung = ?", (ma_nguoi_dung,))
            row = cursor.fetchone()
            
            if not row:
                cursor.execute(
                    "INSERT INTO GioHang (ma_nguoi_dung) OUTPUT INSERTED.id VALUES (?)",
                    (ma_nguoi_dung,)
                )
                ma_gio_hang = cursor.fetchone()[0]
            else:
                ma_gio_hang = row[0]
            
            # Kiểm tra sản phẩm đã có trong giỏ chưa
            cursor.execute("""
                SELECT id, so_luong FROM ChiTietGioHang 
                WHERE ma_gio_hang = ? AND ma_san_pham = ?
            """, (ma_gio_hang, ma_san_pham))
            
            chi_tiet = cursor.fetchone()
            
            if chi_tiet:
                # Cập nhật số lượng nếu đã có
                so_luong_hien_tai = chi_tiet[1]
                so_luong_moi = so_luong_hien_tai + so_luong
                
                if so_luong_moi > so_luong_ton:
                    raise Exception(f"Sản phẩm '{ten_san_pham}' không đủ số lượng. Còn lại: {so_luong_ton}, trong giỏ: {so_luong_hien_tai}")
                
                cursor.execute("""
                    UPDATE ChiTietGioHang SET so_luong = ? 
                    WHERE id = ?
                """, (so_luong_moi, chi_tiet[0]))
            else:
                # Thêm mới nếu chưa có
                if so_luong > so_luong_ton:
                    raise Exception(f"Sản phẩm '{ten_san_pham}' không đủ số lượng. Còn lại: {so_luong_ton}")
                
                cursor.execute("""
                    INSERT INTO ChiTietGioHang (ma_gio_hang, ma_san_pham, so_luong)
                    VALUES (?, ?, ?)
                """, (ma_gio_hang, ma_san_pham, so_luong))
            
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Lỗi khi thêm sản phẩm vào giỏ: {e}")
            raise e
        finally:
            cursor.close()
    
    def cap_nhat_so_luong(self, ma_chi_tiet, so_luong):
        """Cập nhật số lượng sản phẩm trong giỏ."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            if so_luong <= 0:
                # Xóa nếu số lượng <= 0
                cursor.execute("DELETE FROM ChiTietGioHang WHERE id = ?", (ma_chi_tiet,))
            else:
                cursor.execute("""
                    UPDATE ChiTietGioHang SET so_luong = ? WHERE id = ?
                """, (so_luong, ma_chi_tiet))
            
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi cập nhật số lượng: {e}")
            return False
        finally:
            cursor.close()
    
    def xoa_san_pham_khoi_gio(self, ma_chi_tiet):
        """Xóa sản phẩm khỏi giỏ hàng."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("DELETE FROM ChiTietGioHang WHERE id = ?", (ma_chi_tiet,))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi xóa sản phẩm khỏi giỏ: {e}")
            return False
        finally:
            cursor.close()
    
    def xoa_gio_hang(self, ma_nguoi_dung):
        """Xóa toàn bộ giỏ hàng của người dùng."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("SELECT id FROM GioHang WHERE ma_nguoi_dung = ?", (ma_nguoi_dung,))
            row = cursor.fetchone()
            
            if row:
                ma_gio_hang = row[0]
                cursor.execute("DELETE FROM ChiTietGioHang WHERE ma_gio_hang = ?", (ma_gio_hang,))
                db.commit()
                return True
            return False
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi xóa giỏ hàng: {e}")
            return False
        finally:
            cursor.close()
