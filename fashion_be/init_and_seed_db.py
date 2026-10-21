#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
init_and_seed_db.py - Tự động khởi tạo lại Database và Nạp Dữ Liệu Chuẩn ÉLÉGANCE
"""
import os
import sys
import hashlib
import pymysql

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BE_DIR)
SQL_FILE = os.path.join(PROJECT_ROOT, "fashiondb.sql")
ENV_FILE = os.path.join(BE_DIR, ".env")

def load_env():
    env_vars = {
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_USER": "root",
        "DB_PASSWORD": "",
        "DB_NAME": "fashion_ecommerce_db"
    }
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip()
    return env_vars

def hash_pw(pw: str) -> str:
    salt = "fashion_salt_secure_2026"
    return hashlib.sha256((pw + salt).encode('utf-8')).hexdigest()

def main():
    config = load_env()
    print("=================================================================")
    print(" 👗 ÉLÉGANCE - KHỞI TẠO VÀ NẠP CƠ SỞ DỮ LIỆU MYSQL")
    print("=================================================================")
    print(f"Host: {config['DB_HOST']}:{config['DB_PORT']} | User: {config['DB_USER']} | DB: {config['DB_NAME']}")

    # 1. Kết nối không chọn DB để tạo Database
    conn = pymysql.connect(
        host=config["DB_HOST"],
        port=int(config["DB_PORT"]),
        user=config["DB_USER"],
        password=config["DB_PASSWORD"],
        charset="utf8mb4"
    )

    with conn.cursor() as cursor:
        print(f"-> Tạo Database `{config['DB_NAME']}` nếu chưa tồn tại...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{config['DB_NAME']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.execute(f"USE `{config['DB_NAME']}`;")

        # 2. Đọc file SQL schema
        print(f"-> Thực thi cấu trúc bảng từ `{SQL_FILE}`...")
        with open(SQL_FILE, "r", encoding="utf-8") as f:
            sql_content = f.read()

        # Tách các lệnh SQL theo dấu ;
        statements = sql_content.split(";")
        for stmt in statements:
            stmt = stmt.strip()
            if stmt:
                try:
                    cursor.execute(stmt)
                except Exception as e:
                    print(f"   [Cảnh báo/Lỗi SQL]: {e} khi chạy:\n{stmt[:80]}...")

        conn.commit()
        print("-> Đã khởi tạo xong các bảng.")

        # 3. Seed dữ liệu mẫu chuẩn
        print("-> Bắt đầu nạp dữ liệu mẫu chuẩn...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

        # 3.1 USERS
        pw_hashed = hash_pw("123456")
        users_data = [
            (1, "Quản Trị Viên ÉLÉGANCE", "admin@fashion.com", "0900000001", pw_hashed, "ADMIN", 1),
            (2, "Trần Thu Ngân (Thủ Kho)", "staff@fashion.com", "0900000002", pw_hashed, "STAFF", 1),
            (3, "Nguyễn Hoàng Long", "customer@fashion.com", "0900000003", pw_hashed, "CUSTOMER", 1),
        ]
        cursor.execute("TRUNCATE TABLE users;")
        cursor.executemany("""
            INSERT INTO users (user_id, full_name, email, phone_number, password_hash, role, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, users_data)

        # 3.2 USER ADDRESSES
        cursor.execute("TRUNCATE TABLE user_addresses;")
        cursor.execute("""
            INSERT INTO user_addresses (address_id, user_id, receiver_name, receiver_phone, province, ward, street_detail, is_default)
            VALUES (1, 3, 'Nguyễn Hoàng Long', '0900000003', 'TP. Hồ Chí Minh', 'Phường Bến Nghé', '123 Lê Lợi, Quận 1', 1)
        """)

        # 3.3 CATEGORIES
        categories = [
            (1, None, "Áo Sơ Mi Nam", "ao-so-mi-nam", 1),
            (2, None, "Quần Tây Nam", "quan-tay-nam", 1),
            (3, None, "Đầm & Váy Nữ", "dam-vay-nu", 1),
            (4, None, "Áo Khoác & Blazer", "ao-khoac-blazer", 1),
            (5, None, "Phụ Kiện Da Cao Cấp", "phu-kien-da-cao-cap", 1),
        ]
        cursor.execute("TRUNCATE TABLE categories;")
        cursor.executemany("""
            INSERT INTO categories (category_id, parent_id, name, slug, is_active)
            VALUES (%s, %s, %s, %s, %s)
        """, categories)

        # 3.4 BRANDS
        brands = [
            (1, "ÉLÉGANCE Atelier", "elegance-atelier", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200"),
            (2, "Dior Homme", "dior-homme", "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200"),
            (3, "Chanel Paris", "chanel-paris", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200"),
            (4, "Saint Laurent", "saint-laurent", "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200"),
            (5, "Gucci", "gucci", "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200"),
        ]
        cursor.execute("TRUNCATE TABLE brands;")
        cursor.executemany("""
            INSERT INTO brands (brand_id, name, slug, logo_url)
            VALUES (%s, %s, %s, %s)
        """, brands)

        # 3.5 SUPPLIERS
        suppliers = [
            (1, "Xưởng Dệt May Cao Cấp Sài Gòn", "Nguyễn Văn Hưng", "0912345678", "hung.detmay@gmail.com", "45 Nguyễn Huệ, Quận 1, TP.HCM", 1),
            (2, "Lụa Tơ Tằm Thượng Hạng Hà Đông", "Lê Thị Thu", "0987654321", "thu.hadong@silk.vn", "Làng lụa Vạn Phúc, Hà Đông, Hà Nội", 1),
            (3, "ÉLÉGANCE Global Sourcing", "Michael Pham", "0903112233", "sourcing@elegance.com", "Khu Công Nghệ Cao, TP. Thủ Đức", 1),
        ]
        cursor.execute("TRUNCATE TABLE suppliers;")
        cursor.executemany("""
            INSERT INTO suppliers (supplier_id, name, contact_name, phone, email, address, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, suppliers)

        # 3.6 PRODUCTS
        products = [
            (1, 1, 1, "Áo Sơ Mi Lụa ÉLÉGANCE Signature", "ao-so-mi-lua-elegance-signature",
             "Chiếc áo sơ mi lụa tơ tằm thượng hạng mang phong cách tối giản xa hoa, đường cắt may chuẩn Sharp Tailoring sắc sảo.",
             1850000.00, "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800", 1, 1),

            (2, 4, 1, "Áo Khoác Blazer ÉLÉGANCE Modern Noir", "ao-khoac-blazer-elegance-modern-noir",
             "Blazer thiết kế phẳng tinh xảo, chất liệu len pha cashmere cao cấp giữ ấm và tạo form đứng đẳng cấp.",
             3450000.00, "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800", 1, 1),

            (3, 2, 1, "Quần Tây May Đo Ý ÉLÉGANCE Tailored Trousers", "quan-tay-may-do-y-elegance-tailored-trousers",
             "Quần âu xếp ly phẳng tinh tế, vải wool dệt chéo thoáng khí chống nhăn tuyệt đối.",
             1450000.00, "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800", 1, 1),

            (4, 3, 2, "Đầm Dạ Hội Lụa Đỏ Bordeaux Dior Style", "dam-da-hoi-lua-do-bordeaux-dior-style",
             "Đầm dạ hội xếp nếp thủ công tôn dáng quyến rũ quý phái cho các buổi tiệc gala.",
             4950000.00, "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800", 1, 1),

            (5, 5, 4, "Thắt Lưng Da Bò Ý Khóa Bạc Nguyên Khối", "that-lung-da-bo-y-khoa-bac-nguyen-khoi",
             "Thắt lưng da thuộc thảo mộc nguyên bản kết hợp khóa mạ bạch kim bóng mờ.",
             1200000.00, "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800", 0, 1),
        ]
        cursor.execute("TRUNCATE TABLE products;")
        cursor.executemany("""
            INSERT INTO products (product_id, category_id, brand_id, name, slug, description, base_price, thumbnail, has_variants, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, products)

        # 3.7 PRODUCT IMAGES
        product_images = [
            (1, 1, "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800", 0),
            (2, 1, "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800", 1),
            (3, 2, "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800", 0),
            (4, 3, "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800", 0),
            (5, 4, "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800", 0),
            (6, 5, "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800", 0),
        ]
        cursor.execute("TRUNCATE TABLE product_images;")
        cursor.executemany("""
            INSERT INTO product_images (image_id, product_id, image_url, sort_order)
            VALUES (%s, %s, %s, %s)
        """, product_images)

        # 3.8 PRODUCT VARIANTS
        variants = [
            # SP 1
            (1, 1, "SGM-SILK-BLK-M", "Đen Tuyền", "M", 1850000.00, 45),
            (2, 1, "SGM-SILK-BLK-L", "Đen Tuyền", "L", 1850000.00, 30),
            (3, 1, "SGM-SILK-WHT-M", "Trắng Ngọc Trai", "M", 1850000.00, 50),
            (4, 1, "SGM-SILK-WHT-L", "Trắng Ngọc Trai", "L", 1850000.00, 25),
            # SP 2
            (5, 2, "BLZ-NOIR-BLK-M", "Đen Classic", "M", 3450000.00, 20),
            (6, 2, "BLZ-NOIR-BLK-L", "Đen Classic", "L", 3450000.00, 15),
            (7, 2, "BLZ-NOIR-GRY-M", "Xám Tro", "M", 3450000.00, 18),
            # SP 3
            (8, 3, "TRS-ITA-BLK-30", "Đen", "30", 1450000.00, 40),
            (9, 3, "TRS-ITA-BLK-32", "Đen", "32", 1450000.00, 35),
            # SP 4
            (10, 4, "DRS-RED-BRD-S", "Đỏ Bordeaux", "S", 4950000.00, 12),
            (11, 4, "DRS-RED-BRD-M", "Đỏ Bordeaux", "M", 4950000.00, 10),
            # SP 5 (đơn lẻ)
            (12, 5, "BLT-LTH-STD", "Tiêu chuẩn", "Tiêu chuẩn", 1200000.00, 60),
        ]
        cursor.execute("TRUNCATE TABLE product_variants;")
        cursor.executemany("""
            INSERT INTO product_variants (variant_id, product_id, sku, color, size, price, stock_quantity)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, variants)

        # 3.9 PURCHASE RECEIPTS & ITEMS
        cursor.execute("TRUNCATE TABLE purchase_receipts;")
        cursor.execute("TRUNCATE TABLE purchase_receipt_items;")
        cursor.execute("""
            INSERT INTO purchase_receipts (receipt_id, receipt_code, supplier_id, created_by, total_cost, note, received_at)
            VALUES (1, 'REC-202610-001', 1, 2, 165000000.00, 'Lô hàng nhập đầu mùa Thu Đông 2026', NOW())
        """)
        cursor.execute("""
            INSERT INTO purchase_receipt_items (receipt_item_id, receipt_id, variant_id, import_price, quantity)
            VALUES
            (1, 1, 1, 1100000.00, 50),
            (2, 1, 3, 1100000.00, 50),
            (3, 1, 5, 2200000.00, 25)
        """)

        # 3.10 CARTS & CART ITEMS
        cursor.execute("TRUNCATE TABLE carts;")
        cursor.execute("TRUNCATE TABLE cart_items;")
        cursor.execute("""
            INSERT INTO carts (cart_id, user_id) VALUES (1, 3)
        """)
        cursor.execute("""
            INSERT INTO cart_items (cart_item_id, cart_id, variant_id, quantity)
            VALUES (1, 1, 1, 1)
        """)

        # 3.11 ORDERS & ORDER ITEMS
        cursor.execute("TRUNCATE TABLE orders;")
        cursor.execute("TRUNCATE TABLE order_items;")
        cursor.execute("""
            INSERT INTO orders (order_id, order_code, user_id, receiver_name, receiver_phone, shipping_address, total_amount, order_status, payment_method, payment_status, note)
            VALUES (1, 'ORD-202610-888', 3, 'Nguyễn Hoàng Long', '0900000003', '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 3700000.00, 'DELIVERED', 'COD', 'PAID', 'Giao hàng giờ hành chính')
        """)
        cursor.execute("""
            INSERT INTO order_items (order_item_id, order_id, variant_id, product_name, variant_sku, color, size, price, quantity, total_price)
            VALUES
            (1, 1, 1, 'Áo Sơ Mi Lụa ÉLÉGANCE Signature', 'SGM-SILK-BLK-M', 'Đen Tuyền', 'M', 1850000.00, 2, 3700000.00)
        """)

        # 3.12 PRODUCT REVIEWS
        cursor.execute("TRUNCATE TABLE product_reviews;")
        cursor.execute("""
            INSERT INTO product_reviews (review_id, product_id, user_id, order_id, rating, comment)
            VALUES
            (1, 1, 3, 1, 5, 'Chất lụa tơ tằm cực kỳ mềm mát và đứng form. Đóng hộp ÉLÉGANCE rất chỉn chu và sang trọng.'),
            (2, 2, 3, 1, 5, 'Áo blazer cắt may chuẩn form, chất vải dầy dặn cao cấp, xứng đáng từng đồng.')
        """)

        # 3.13 BLOG POSTS
        cursor.execute("TRUNCATE TABLE blog_posts;")
        cursor.execute("""
            INSERT INTO blog_posts (post_id, author_id, title, slug, thumbnail, summary, content, is_published)
            VALUES
            (1, 1, 'Xu Hướng Thời Trang Tối Giản (Minimalist Luxury) Lên Ngôi 2026', 'xu-huong-thoi-trang-toi-gian-2026',
             'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
             'Thời trang tối giản hiện đại không chỉ là cách ăn mặc, mà là một triết lý thẩm mỹ hướng tới chất liệu thuần khiết và phom dáng chuẩn mực.',
             '<p>Trong thế giới thời trang cao cấp năm 2026, chủ nghĩa tối giản (Minimalist Luxury) đã đạt đến một nấc thang mới...</p>', 1),
            (2, 1, 'Nghệ Thuật May Đo Sharp Tailoring Trong Từng Đường Kim Mũi Chỉ', 'nghe-thuat-may-do-sharp-tailoring',
             'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
             'Khám phá kỹ thuật dựng phom sắc nét tạo nên dấu ấn độc bản của nhà mốt ÉLÉGANCE.',
             '<p>Đằng sau mỗi chiếc áo blazer hay quần âu của ÉLÉGANCE là hàng trăm giờ hoàn thiện tỉ mỉ...</p>', 1)
        """)

        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        conn.commit()
        print("✅ ĐÃ KHỞI TẠO VÀ NẠP TOÀN BỘ DỮ LIỆU CƠ SỞ THÀNH CÔNG!")

    conn.close()

if __name__ == "__main__":
    main()
