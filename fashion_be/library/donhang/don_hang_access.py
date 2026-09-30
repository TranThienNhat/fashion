from library.db_connection import get_db
from library.sanpham.sp_access import ProductRepository
import pyodbc

class DonHangRepository:
    def __init__(self):
        self.sp_repo = ProductRepository()
    
    def lay_tat_ca(self):
        """Lấy tất cả đơn hàng."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, ma_nguoi_dung, ten_khach_hang, so_dien_thoai, 
                       dia_chi, ngay_dat, tong_gia, trang_thai
                FROM DonHang
                ORDER BY ngay_dat DESC
            """)
            
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_don_hang = [dict(zip(columns, row)) for row in ket_qua]
            return ds_don_hang
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy danh sách đơn hàng: {e}")
            return None
        finally:
            cursor.close()
    
    def lay_theo_id(self, ma_don_hang):
        """Lấy chi tiết đơn hàng theo ID."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            # Lấy thông tin đơn hàng
            cursor.execute("""
                SELECT id, ma_nguoi_dung, ten_khach_hang, so_dien_thoai,
                       dia_chi, ngay_dat, tong_gia, trang_thai
                FROM DonHang
                WHERE id = ?
            """, (ma_don_hang,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            columns = [col[0] for col in cursor.description]
            don_hang = dict(zip(columns, row))
            
            # Lấy chi tiết sản phẩm trong đơn hàng
            cursor.execute("""
                SELECT ct.id, ct.ma_san_pham, sp.ten_san_pham, 
                       ct.so_luong, ct.don_gia, (ct.so_luong * ct.don_gia) as thanh_tien
                FROM ChiTietDonHang ct
                JOIN SanPham sp ON ct.ma_san_pham = sp.id
                WHERE ct.ma_don_hang = ?
            """, (ma_don_hang,))
            
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            chi_tiet = [dict(zip(columns, row)) for row in ket_qua]
            
            don_hang["chi_tiet"] = chi_tiet
            return don_hang
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy đơn hàng: {e}")
            return None
        finally:
            cursor.close()
    
    def lay_theo_nguoi_dung(self, ma_nguoi_dung):
        """Lấy danh sách đơn hàng của người dùng."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, ma_nguoi_dung, ten_khach_hang, so_dien_thoai,
                       dia_chi, ngay_dat, tong_gia, trang_thai
                FROM DonHang
                WHERE ma_nguoi_dung = ?
                ORDER BY ngay_dat DESC
            """, (ma_nguoi_dung,))
            
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_don_hang = [dict(zip(columns, row)) for row in ket_qua]
            return ds_don_hang
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy đơn hàng của người dùng: {e}")
            return None
        finally:
            cursor.close()
    
    def tao_don_hang(self, ma_nguoi_dung, ten_khach_hang, so_dien_thoai, dia_chi, chi_tiet_san_pham):
        """Tạo đơn hàng mới từ giỏ hàng hoặc danh sách sản phẩm."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            
            # Kiểm tra số lượng tồn kho trước khi tạo đơn hàng
            for item in chi_tiet_san_pham:
                cursor.execute("SELECT so_luong FROM SanPham WHERE id = ? AND da_xoa = 0", (item["ma_san_pham"],))
                row = cursor.fetchone()
                if not row:
                    raise Exception(f"Sản phẩm ID {item['ma_san_pham']} không tồn tại")
                
                so_luong_ton = row[0]
                if so_luong_ton < item["so_luong"]:
                    cursor.execute("SELECT ten_san_pham FROM SanPham WHERE id = ?", (item["ma_san_pham"],))
                    ten_sp = cursor.fetchone()[0]
                    raise Exception(f"Sản phẩm '{ten_sp}' không đủ số lượng. Còn lại: {so_luong_ton}")
            
            # Tính tổng giá
            tong_gia = 0
            for item in chi_tiet_san_pham:
                cursor.execute("SELECT gia FROM SanPham WHERE id = ?", (item["ma_san_pham"],))
                row = cursor.fetchone()
                if row:
                    gia = row[0]
                    tong_gia += gia * item["so_luong"]
            
            # Tạo đơn hàng
            cursor.execute("""
                INSERT INTO DonHang (ma_nguoi_dung, ten_khach_hang, so_dien_thoai, dia_chi, tong_gia)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?)
            """, (ma_nguoi_dung, ten_khach_hang, so_dien_thoai, dia_chi, tong_gia))
            
            ma_don_hang = cursor.fetchone()[0]
            
            # Thêm chi tiết đơn hàng và giảm số lượng tồn kho
            for item in chi_tiet_san_pham:
                cursor.execute("SELECT gia FROM SanPham WHERE id = ?", (item["ma_san_pham"],))
                row = cursor.fetchone()
                if row:
                    don_gia = row[0]
                    cursor.execute("""
                        INSERT INTO ChiTietDonHang (ma_don_hang, ma_san_pham, so_luong, don_gia)
                        VALUES (?, ?, ?, ?)
                    """, (ma_don_hang, item["ma_san_pham"], item["so_luong"], don_gia))
                    
                    # Giảm số lượng tồn kho
                    cursor.execute("""
                        UPDATE SanPham SET so_luong = so_luong - ? WHERE id = ?
                    """, (item["so_luong"], item["ma_san_pham"]))
            
            db.commit()
            return ma_don_hang
        except Exception as e:
            db.rollback()
            print(f"Lỗi khi tạo đơn hàng: {e}")
            return None
        finally:
            cursor.close()
    
    def cap_nhat_trang_thai(self, ma_don_hang, trang_thai):
        """Cập nhật trạng thái đơn hàng."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            
            # Nếu đơn hàng bị hủy, hoàn trả số lượng sản phẩm
            if trang_thai.lower() in ['hủy', 'huy', 'cancelled', 'canceled']:
                # Lấy chi tiết đơn hàng
                cursor.execute("""
                    SELECT ma_san_pham, so_luong 
                    FROM ChiTietDonHang 
                    WHERE ma_don_hang = ?
                """, (ma_don_hang,))
                
                chi_tiet = cursor.fetchall()
                
                # Hoàn trả số lượng cho từng sản phẩm
                for ma_san_pham, so_luong in chi_tiet:
                    cursor.execute("""
                        UPDATE SanPham SET so_luong = so_luong + ? WHERE id = ?
                    """, (so_luong, ma_san_pham))
            
            cursor.execute("""
                UPDATE DonHang SET trang_thai = ? WHERE id = ?
            """, (trang_thai, ma_don_hang))
            
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi cập nhật trạng thái: {e}")
            return False
        finally:
            cursor.close()
    
    def xoa_don_hang(self, ma_don_hang):
        """Xóa đơn hàng và hoàn trả số lượng sản phẩm."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            
            # Lấy chi tiết đơn hàng trước khi xóa
            cursor.execute("""
                SELECT ma_san_pham, so_luong 
                FROM ChiTietDonHang 
                WHERE ma_don_hang = ?
            """, (ma_don_hang,))
            
            chi_tiet = cursor.fetchall()
            
            # Hoàn trả số lượng cho từng sản phẩm
            for ma_san_pham, so_luong in chi_tiet:
                cursor.execute("""
                    UPDATE SanPham SET so_luong = so_luong + ? WHERE id = ?
                """, (so_luong, ma_san_pham))
            
            # Xóa đơn hàng (cascade sẽ xóa chi tiết đơn hàng)
            cursor.execute("DELETE FROM DonHang WHERE id = ?", (ma_don_hang,))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi xóa đơn hàng: {e}")
            return False
        finally:
            cursor.close()
