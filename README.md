# ÉLÉGANCE - Nền Tảng Thương Mại Điện Tử Thời Trang Cao Cấp (Haute Couture & Minimalist Luxury)

Chào mừng bạn đến với dự án **ÉLÉGANCE**, hệ thống website thương mại điện tử thời trang được xây dựng theo phong cách **Minimalist Luxury** (Tối giản cao cấp) lấy cảm hứng từ các nhà mốt danh tiếng hàng đầu thế giới (The Row, Loro Piana, Céline, Jil Sander).

Hệ thống được thiết kế với kiến trúc phân tách độc lập (Decoupled Architecture):
- **Backend (`fashion_be`)**: Python Flask RESTful API, hoàn toàn sử dụng **Native SQL Queries** chuẩn hóa qua kiến trúc Module / Library.
- **Frontend (`fashion_fe`)**: Next.js 15 (App Router, React 19, TypeScript), Ant Design 5 được tinh chỉnh phong cách tối giản phẳng sắc nét (`border-radius: 0px`, bảng màu Pure Matte Noir `#0D0D0D` và Muted Warm Stone `#8F877F`).

---

## 📁 1. Cấu Trúc Thư Mục Dự Án

```
Fashion/
├── fashion_be/                  # Mã nguồn Backend Flask (Port 5000)
│   ├── app.py                   # Điểm khởi động ứng dụng & Đăng ký Blueprints
│   ├── requirements.txt         # Thư viện Python phụ thuộc
│   ├── .env                     # Cấu hình kết nối MySQL và JWT Secret
│   ├── uploads/                 # Thư mục lưu trữ ảnh tải lên từ máy tính
│   └── library/                 # Kiến trúc Module Backend (Native SQL)
│       ├── auth/                # Xác thực JWT, Phân quyền (ADMIN, STAFF, CUSTOMER)
│       ├── catalog/             # Sản phẩm, Biến thể (Màu, Size), Danh mục, Thương hiệu
│       ├── cart/                # Giỏ hàng & Đồng bộ biến thể
│       ├── order/               # Đơn hàng, Trạng thái vận chuyển & Tồn kho
│       ├── inventory/           # Quản lý nhập kho & Nhà cung cấp
│       ├── review_blog/         # Đánh giá sản phẩm & Tạp chí thời trang
│       ├── banner/              # Quản lý Banner Lookbook quảng cáo
│       ├── upload/              # Xử lý upload ảnh trực tiếp lên server
│       └── ...
│
├── fashion_fe/                  # Mã nguồn Frontend Next.js (Port 3000)
│   ├── app/                     # App Router
│   │   ├── page.tsx             # Trang chủ Lookbook Editorial
│   │   ├── products/            # Danh mục sản phẩm & Bộ lọc đa chiều
│   │   │   └── [id]/            # Trang chi tiết sản phẩm & Chọn màu/size động
│   │   ├── cart/                # Giỏ hàng & Drawer túi đồ
│   │   ├── checkout/            # Đặt hàng & Thanh toán COD / Chuyển khoản
│   │   ├── admin/               # Cổng Quản trị viên (Dashboard, Sản phẩm, Kho, Đơn hàng...)
│   │   ├── news/                # Tạp chí phong cách & Blog thời trang
│   │   └── (auth)/              # Đăng nhập & Đăng ký tài khoản
│   ├── components/              # Các UI Component tái sử dụng
│   │   ├── ImageUploader.tsx    # Kéo thả & Tải ảnh trực tiếp lên server
│   │   ├── MainHeader.tsx       # Thanh điều hướng Minimalist
│   │   ├── MainFooter.tsx       # Chân trang phong cách thời trang kiến trúc
│   │   └── MainLayout.tsx       # Layout chuẩn khung canvas trắng
│   ├── contexts/                # AppContext & CartContext (State Management)
│   ├── lib/                     # API client (Axios), Type Definitions, Constants
│   └── .env.local               # Cấu hình biến môi trường Frontend
│
├── fashiondb.sql                # File mã nguồn tạo lược đồ CSDL MySQL
└── README.md                    # Tài liệu hướng dẫn sử dụng & vận hành dự án
```

---

## 🛠️ 2. Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: Phiên bản 18.x hoặc 20.x LTS trở lên
- **Python**: Phiên bản 3.9 trở lên
- **MySQL / MariaDB Server**: Cổng mặc định 3306
- Trình quản lý gói: `npm` (cho Frontend) và `pip` (cho Backend)

---

## 🗄️ 3. Cài Đặt Cơ Sở Dữ Liệu (Database Setup)

1. Mở MySQL Client / Navicat / DBeaver / phpMyAdmin hoặc terminal MySQL:
   ```sql
   CREATE DATABASE fashion_ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Thực thi tệp `fashiondb.sql` vào cơ sở dữ liệu vừa tạo:
   - Qua terminal dòng lệnh:
     ```bash
     mysql -u root -p fashion_ecommerce_db < fashiondb.sql
     ```
   - Hoặc mở tệp `fashiondb.sql` trong giao diện quản lý DB (như HeidiSQL, DBeaver) và chạy toàn bộ mã lệnh SQL.

3. Nạp dữ liệu mẫu (Seed Data) bằng tệp `seed.sql`:
   - Cách 1: Qua lệnh MySQL:
     ```bash
     mysql -u root -p fashion_ecommerce_db < seed.sql
     ```
   - Cách 2: Chạy trực tiếp script Python seeder:
     ```bash
     cd fashion_be
     python seed.py
     ```

---

## ⚙️ 4. Cấu Hình Môi Trường

### 4.1. Cấu hình Backend (`fashion_be/.env`)
Kiểm tra và tùy chỉnh thông tin kết nối trong tệp `fashion_be/.env`:
```env
# Cấu hình Cơ sở dữ liệu MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=fashion_ecommerce_db

# Cấu hình bảo mật JWT Token
JWT_SECRET_KEY=fashion_secret_jwt_key_2026_xyz_super_secure

# Cổng khởi chạy Backend
PORT=5000
BASE_URL=http://localhost:5000
```

### 4.2. Cấu hình Frontend (`fashion_fe/.env.local`)
Tệp `fashion_fe/.env.local` trỏ API tới Backend:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
```

---

## 🚀 5. Hướng Dẫn Khởi Chạy Hệ Thống

### 5.1. Khởi chạy Backend Server (Flask)

1. Mở terminal tại thư mục `fashion_be`:
   ```bash
   cd fashion_be
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```
3. Khởi chạy máy chủ API:
   ```bash
   python app.py
   ```
   Backend sẽ lắng nghe tại: **`http://127.0.0.1:5000`**
   - API Endpoint: `http://127.0.0.1:5000/api/...`
   - Phục vụ tệp tĩnh ảnh tải lên: `http://127.0.0.1:5000/uploads/{filename}`

---

### 5.2. Khởi chạy Frontend (Next.js)

1. Mở một terminal khác tại thư mục `fashion_fe`:
   ```bash
   cd fashion_fe
   ```
2. Cài đặt thư viện Node modules (nếu chưa có):
   ```bash
   npm install
   ```
3. **Biên dịch Production (Khuyên dùng)**:
   Để chuyển trang mượt mà tức thì mà không phải chờ JIT compiling:
   ```bash
   npm run build
   npm run start
   ```
   *(Hoặc chạy chế độ phát triển: `npm run dev`)*

4. Mở trình duyệt và truy cập: **`http://localhost:3000`**

---

## 🔐 6. Danh Sách Tài Khoản Mẫu Trải Nghiệm

Hệ thống có sẵn các tài khoản với các cấp phân quyền khác nhau:

| Vai trò | Email đăng nhập | Số điện thoại | Mật khẩu | Quyền hạn & Chức năng |
| :--- | :--- | :--- | :--- | :--- |
| **👑 QUẢN TRỊ VIÊN (ADMIN)** | `admin@fashion.com` | `0900000001` | **`123456`** | Truy cập toàn bộ khu vực Quản trị tại [/admin](http://localhost:3000/admin): Quản lý Sản phẩm, Biến thể, Tồn kho, Nhà cung cấp, Đơn hàng, Banner, Tin tức, Báo cáo doanh thu |
| **📦 NHÂN VIÊN KHO (STAFF)** | `staff@fashion.com` | `0900000002` | **`123456`** | Quản lý phiếu nhập kho, theo dõi tồn kho biến thể, đóng gói đơn hàng |
| **🛍️ KHÁCH HÀNG (CUSTOMER)** | `customer@fashion.com` | `0900000003` | **`123456`** | Lướt Lookbook, lọc sản phẩm theo màu/size, thêm giỏ hàng, đặt hàng COD/Bank, tra cứu lịch sử mua hàng, đánh giá sao |

> [!NOTE]  
> Bạn có thể đăng ký tài khoản khách hàng mới bất kỳ lúc nào tại: [http://localhost:3000/register](http://localhost:3000/register).

---

## ✨ 7. Các Tính Năng Nổi Bật

### 🎨 1. Giao Diện Tối Giản Cao Cấp (Minimalist Luxury)
- Tông màu chủ đạo: **Pure Matte Noir (`#0D0D0D`)**, **Ivory Pearl (`#FFFFFF` & `#F9F9F8`)**, nhấn **Muted Warm Stone (`#8F877F`)**.
- Phong cách **Sharp Tailoring**: Toàn bộ nút bấm, khung ảnh, thẻ kích thước và ô nhập liệu đều có góc cắt phẳng sắc nét (`border-radius: 0px`).
- Đường viền mỏng nhẹ 1px (`#EAEAE8`), khoảng thở thoáng đạt (negative space) chuẩn phong cách tạp chí thời trang.

### 👗 2. Lựa Chọn Biến Thể Thời Trang Động (Smart Variants)
- **Ràng buộc Màu sắc & Kích thước**: Khi người dùng nhấp chọn một màu sắc (ví dụ: *Đen tuyền*), danh sách kích thước (Size: *S, M, L, XL*) sẽ tự động lọc và **chỉ hiển thị đúng các size thực tế có của màu đó**.
- **Cảnh báo tồn kho thời gian thực**: Tự động thông báo còn hàng hoặc hết hàng cho từng biến thể SKU cụ thể.

### 🖼️ 3. Tính Năng Tải Ảnh Trực Tiếp Lên Server (Local File Upload)
- Component [ImageUploader.tsx](fashion_fe/components/ImageUploader.tsx) hỗ trợ kéo thả ảnh hoặc click chọn từ máy tính.
- Tự động sinh tên file unique, lưu trữ bảo mật tại `fashion_be/uploads/`.
- Tích hợp xem trước ảnh tức thì (Preview) đúng tỷ lệ chuẩn của thời trang (3:4 cho trang phục, 16:9 cho banner/bài viết, 1:1 cho logo).
- Có mặt trên tất cả các trang quản trị: **Sản phẩm, Tin tức, Thương hiệu, Banner**.

### 📦 4. Quản Lý Nhập Kho & Đơn Hàng Chuẩn Xác
- Tự động trừ tồn kho khi khách đặt hàng thành công.
- Tự động hoàn lại tồn kho biến thể khi đơn hàng bị hủy (`CANCELLED`).
- Phiếu nhập kho hỗ trợ ghi nhận nhà cung cấp và cộng dồn số lượng tồn theo từng biến thể chi tiết.
