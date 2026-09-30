from library.db_connection import get_db
import pyodbc
import hashlib

class NguoiDungRepository:
    
    def ma_hoa_mat_khau(self, mat_khau):
        """Mã hóa mật khẩu bằng SHA256."""
        return hashlib.sha256(mat_khau.encode()).hexdigest()
    
    def dang_ky(self, ten_dang_nhap, mat_khau, email=None, ho_ten=None, sdt=None, vai_tro="khach_hang"):
        """Đăng ký người dùng mới."""
        print(f"DEBUG REPO - Starting registration for: {ten_dang_nhap}")
        
        db = get_db()
        if db is None: 
            print("DEBUG REPO - Database connection failed")
            return None
        
        try:
            cursor = db.cursor()
            print("DEBUG REPO - Database cursor created")
            
            # Kiểm tra tên đăng nhập đã tồn tại chưa
            cursor.execute("SELECT id FROM NguoiDung WHERE ten_dang_nhap = ?", (ten_dang_nhap,))
            existing_user = cursor.fetchone()
            if existing_user:
                print(f"DEBUG REPO - Username already exists: {ten_dang_nhap}")
                return {"error": "Tên đăng nhập đã tồn tại"}
            
            # Kiểm tra email đã tồn tại chưa
            if email:
                cursor.execute("SELECT id FROM NguoiDung WHERE email = ?", (email,))
                existing_email = cursor.fetchone()
                if existing_email:
                    print(f"DEBUG REPO - Email already exists: {email}")
                    return {"error": "Email đã được sử dụng"}
            
            # Mã hóa mật khẩu
            mat_khau_ma_hoa = self.ma_hoa_mat_khau(mat_khau)
            print("DEBUG REPO - Password hashed")
            
            # Thêm người dùng mới - không dùng OUTPUT vì có thể có trigger
            print(f"DEBUG REPO - Inserting user: {ten_dang_nhap}, {email}, {ho_ten}, {sdt}, {vai_tro}")
            cursor.execute("""
                INSERT INTO NguoiDung (ten_dang_nhap, mat_khau, email, ho_ten, sdt, vai_tro)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (ten_dang_nhap, mat_khau_ma_hoa, email, ho_ten, sdt, vai_tro))
            
            # Lấy ID vừa được tạo
            cursor.execute("SELECT @@IDENTITY")
            new_id = cursor.fetchone()[0]
            db.commit()
            print(f"DEBUG REPO - User created successfully with ID: {new_id}")
            return {"id": new_id, "message": "Đăng ký thành công"}
        except pyodbc.Error as e:
            db.rollback()
            print(f"DEBUG REPO - Database error: {e}")
            return None
        finally:
            cursor.close()
    
    def dang_nhap(self, ten_dang_nhap, mat_khau):
        """Đăng nhập người dùng."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            mat_khau_ma_hoa = self.ma_hoa_mat_khau(mat_khau)
            
            cursor.execute("""
                SELECT id, ten_dang_nhap, email, ho_ten, sdt, vai_tro
                FROM NguoiDung
                WHERE ten_dang_nhap = ? AND mat_khau = ?
            """, (ten_dang_nhap, mat_khau_ma_hoa))
            
            row = cursor.fetchone()
            if not row:
                return {"error": "Tên đăng nhập hoặc mật khẩu không đúng"}
            
            columns = [col[0] for col in cursor.description]
            nguoi_dung = dict(zip(columns, row))
            return nguoi_dung
        except pyodbc.Error as e:
            print(f"Lỗi khi đăng nhập: {e}")
            return None
        finally:
            cursor.close()
    
    def lay_thong_tin(self, ma_nguoi_dung):
        """Lấy thông tin người dùng theo ID."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, ten_dang_nhap, email, ho_ten, sdt, vai_tro
                FROM NguoiDung
                WHERE id = ?
            """, (ma_nguoi_dung,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            columns = [col[0] for col in cursor.description]
            nguoi_dung = dict(zip(columns, row))
            return nguoi_dung
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy thông tin người dùng: {e}")
            return None
        finally:
            cursor.close()
    
    def lay_tat_ca(self):
        """Lấy danh sách tất cả người dùng."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                SELECT id, ten_dang_nhap, email, ho_ten, sdt, vai_tro
                FROM NguoiDung
                ORDER BY id DESC
            """)
            
            ket_qua = cursor.fetchall()
            columns = [col[0] for col in cursor.description]
            ds_nguoi_dung = [dict(zip(columns, row)) for row in ket_qua]
            return ds_nguoi_dung
        except pyodbc.Error as e:
            print(f"Lỗi khi lấy danh sách người dùng: {e}")
            return None
        finally:
            cursor.close()
    
    def cap_nhat_thong_tin(self, ma_nguoi_dung, email=None, ho_ten=None, sdt=None):
        """Cập nhật thông tin người dùng."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("""
                UPDATE NguoiDung
                SET email = COALESCE(?, email),
                    ho_ten = COALESCE(?, ho_ten),
                    sdt = COALESCE(?, sdt)
                WHERE id = ?
            """, (email, ho_ten, sdt, ma_nguoi_dung))
            
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi cập nhật thông tin: {e}")
            return False
        finally:
            cursor.close()
    
    def doi_mat_khau(self, ma_nguoi_dung, mat_khau_cu, mat_khau_moi):
        """Đổi mật khẩu người dùng."""
        db = get_db()
        if db is None: return None
        
        try:
            cursor = db.cursor()
            mat_khau_cu_ma_hoa = self.ma_hoa_mat_khau(mat_khau_cu)
            
            # Kiểm tra mật khẩu cũ
            cursor.execute("""
                SELECT id FROM NguoiDung
                WHERE id = ? AND mat_khau = ?
            """, (ma_nguoi_dung, mat_khau_cu_ma_hoa))
            
            if not cursor.fetchone():
                return {"error": "Mật khẩu cũ không đúng"}
            
            # Cập nhật mật khẩu mới
            mat_khau_moi_ma_hoa = self.ma_hoa_mat_khau(mat_khau_moi)
            cursor.execute("""
                UPDATE NguoiDung
                SET mat_khau = ?
                WHERE id = ?
            """, (mat_khau_moi_ma_hoa, ma_nguoi_dung))
            
            db.commit()
            return {"message": "Đổi mật khẩu thành công"}
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi đổi mật khẩu: {e}")
            return None
        finally:
            cursor.close()
    
    def xoa_nguoi_dung(self, ma_nguoi_dung):
        """Xóa người dùng."""
        db = get_db()
        if db is None: return False
        
        try:
            cursor = db.cursor()
            cursor.execute("DELETE FROM NguoiDung WHERE id = ?", (ma_nguoi_dung,))
            db.commit()
            return cursor.rowcount > 0
        except pyodbc.Error as e:
            db.rollback()
            print(f"Lỗi khi xóa người dùng: {e}")
            return False
        finally:
            cursor.close()
