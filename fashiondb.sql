CREATE DATABASE IF NOT EXISTS `fashion_ecommerce_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fashion_ecommerce_db`;

-- =============================================================================
-- 1. MODULE: USERS & ĐỊA CHỈ
-- =============================================================================

CREATE TABLE IF NOT EXISTS `users` (
    `user_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone_number` VARCHAR(20) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'STAFF', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_addresses` (
    `address_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `receiver_name` VARCHAR(100) NOT NULL,
    `receiver_phone` VARCHAR(20) NOT NULL,
    `province` VARCHAR(100) NOT NULL,
    `ward` VARCHAR(100) NOT NULL,
    `street_detail` VARCHAR(255) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. MODULE: SẢN PHẨM & BIẾN THỂ THỜI TRANG (SIZE, COLOR, TỒN KHO)
-- =============================================================================

CREATE TABLE `categories` (
    `category_id` INT AUTO_INCREMENT PRIMARY KEY,
    `parent_id` INT DEFAULT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) 
        REFERENCES `categories`(`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `brands` (
    `brand_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(120) NOT NULL,
    `logo_url` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
    `product_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NOT NULL,
    `brand_id` INT DEFAULT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` LONGTEXT DEFAULT NULL,
    `base_price` DECIMAL(12, 2) NOT NULL,
    `thumbnail` VARCHAR(255) DEFAULT NULL,
    `has_variants` BOOLEAN NOT NULL DEFAULT TRUE,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) 
        REFERENCES `categories`(`category_id`),
    CONSTRAINT `fk_product_brand` FOREIGN KEY (`brand_id`) 
        REFERENCES `brands`(`brand_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_images` (
    `image_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_image_product` FOREIGN KEY (`product_id`) 
        REFERENCES `products`(`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_variants` (
    `variant_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT NOT NULL,
    `sku` VARCHAR(64) NOT NULL UNIQUE,
    `color` VARCHAR(50) NOT NULL,
    `size` VARCHAR(20) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `stock_quantity` INT NOT NULL DEFAULT 0,
    CONSTRAINT `fk_variant_product` FOREIGN KEY (`product_id`) 
        REFERENCES `products`(`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. MODULE: NHẬP KHO & NHÀ CUNG CẤP
-- =============================================================================

CREATE TABLE `suppliers` (
    `supplier_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `contact_name` VARCHAR(100) DEFAULT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `address` VARCHAR(255) DEFAULT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_receipts` (
    `receipt_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `receipt_code` VARCHAR(32) NOT NULL UNIQUE,
    `supplier_id` INT NOT NULL,
    `created_by` BIGINT NOT NULL,
    `total_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `note` VARCHAR(255) DEFAULT NULL,
    `received_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_receipt_supplier` FOREIGN KEY (`supplier_id`) 
        REFERENCES `suppliers`(`supplier_id`),
    CONSTRAINT `fk_receipt_creator` FOREIGN KEY (`created_by`) 
        REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purchase_receipt_items` (
    `receipt_item_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `receipt_id` BIGINT NOT NULL,
    `variant_id` BIGINT NOT NULL,
    `import_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INT NOT NULL,
    CONSTRAINT `fk_item_receipt` FOREIGN KEY (`receipt_id`) 
        REFERENCES `purchase_receipts`(`receipt_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_item_variant` FOREIGN KEY (`variant_id`) 
        REFERENCES `product_variants`(`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. MODULE: GIỎ HÀNG
-- =============================================================================

CREATE TABLE `carts` (
    `cart_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL UNIQUE,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cart_items` (
    `cart_item_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `cart_id` BIGINT NOT NULL,
    `variant_id` BIGINT NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    UNIQUE KEY `uq_cart_variant` (`cart_id`, `variant_id`),
    CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) 
        REFERENCES `carts`(`cart_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ci_variant` FOREIGN KEY (`variant_id`) 
        REFERENCES `product_variants`(`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. MODULE: ĐƠN HÀNG (TÍCH HỢP THANH TOÁN COD & ONLINE)
-- =============================================================================

CREATE TABLE `orders` (
    `order_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `order_code` VARCHAR(32) NOT NULL UNIQUE,
    `user_id` BIGINT NOT NULL,
    `receiver_name` VARCHAR(100) NOT NULL,
    `receiver_phone` VARCHAR(20) NOT NULL,
    `shipping_address` VARCHAR(255) NOT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `order_status` ENUM('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `payment_method` ENUM('COD', 'VNPAY', 'MOMO', 'BANKING') NOT NULL DEFAULT 'COD',
    `payment_status` ENUM('UNPAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    `transaction_code` VARCHAR(100) DEFAULT NULL,
    `paid_at` DATETIME DEFAULT NULL,
    `note` VARCHAR(255) DEFAULT NULL,
    `address_changed_count` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
    `order_item_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT NOT NULL,
    `variant_id` BIGINT NOT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `variant_sku` VARCHAR(64) NOT NULL,
    `color` VARCHAR(50) NOT NULL,
    `size` VARCHAR(20) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `quantity` INT NOT NULL,
    `total_price` DECIMAL(12, 2) NOT NULL,
    CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) 
        REFERENCES `orders`(`order_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_oi_variant` FOREIGN KEY (`variant_id`) 
        REFERENCES `product_variants`(`variant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. MODULE: ĐÁNH GIÁ SẢN PHẨM & BLOG TIN TỨC
-- =============================================================================

CREATE TABLE `product_reviews` (
    `review_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `order_id` BIGINT DEFAULT NULL,
    `rating` TINYINT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `comment` TEXT DEFAULT NULL,
    `edit_count` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_review_product` FOREIGN KEY (`product_id`) 
        REFERENCES `products`(`product_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users`(`user_id`),
    CONSTRAINT `fk_review_order` FOREIGN KEY (`order_id`) 
        REFERENCES `orders`(`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `blog_posts` (
    `post_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `author_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `thumbnail` VARCHAR(255) DEFAULT NULL,
    `summary` TEXT DEFAULT NULL,
    `content` LONGTEXT NOT NULL,
    `is_published` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_blog_author` FOREIGN KEY (`author_id`) 
        REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHUẨN ÉLÉGANCE)
-- =============================================================================

-- Mật khẩu mặc định cho các tài khoản là: 123456
-- Hash thuật toán SHA-256 + salt 'fashion_salt_secure_2026': 52d7e2daeb8e752eebf8fddcb09a32ce72d9d64027b98ebd4f1d13d0c72f06ca

INSERT INTO `users` (`user_id`, `full_name`, `email`, `phone_number`, `password_hash`, `role`, `is_active`) VALUES
(1, 'Quản Trị Viên ÉLÉGANCE', 'admin@fashion.com', '0900000001', '52d7e2daeb8e752eebf8fddcb09a32ce72d9d64027b98ebd4f1d13d0c72f06ca', 'ADMIN', 1),
(2, 'Trần Thu Ngân (Thủ Kho)', 'staff@fashion.com', '0900000002', '52d7e2daeb8e752eebf8fddcb09a32ce72d9d64027b98ebd4f1d13d0c72f06ca', 'STAFF', 1),
(3, 'Nguyễn Hoàng Long', 'customer@fashion.com', '0900000003', '52d7e2daeb8e752eebf8fddcb09a32ce72d9d64027b98ebd4f1d13d0c72f06ca', 'CUSTOMER', 1)
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);

INSERT INTO `user_addresses` (`address_id`, `user_id`, `receiver_name`, `receiver_phone`, `province`, `ward`, `street_detail`, `is_default`) VALUES
(1, 3, 'Nguyễn Hoàng Long', '0900000003', 'TP. Hồ Chí Minh', 'Phường Bến Nghé', '123 Lê Lợi, Quận 1', 1)
ON DUPLICATE KEY UPDATE `receiver_name`=VALUES(`receiver_name`);

INSERT INTO `categories` (`category_id`, `parent_id`, `name`, `slug`, `is_active`) VALUES
(1, NULL, 'Áo Sơ Mi Nam', 'ao-so-mi-nam', 1),
(2, NULL, 'Quần Tây Nam', 'quan-tay-nam', 1),
(3, NULL, 'Đầm & Váy Nữ', 'dam-vay-nu', 1),
(4, NULL, 'Áo Khoác & Blazer', 'ao-khoac-blazer', 1),
(5, NULL, 'Phụ Kiện Da Cao Cấp', 'phu-kien-da-cao-cap', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `brands` (`brand_id`, `name`, `slug`, `logo_url`) VALUES
(1, 'ÉLÉGANCE Atelier', 'elegance-atelier', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200'),
(2, 'Dior Homme', 'dior-homme', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200'),
(3, 'Chanel Paris', 'chanel-paris', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200'),
(4, 'Saint Laurent', 'saint-laurent', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200'),
(5, 'Gucci', 'gucci', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `suppliers` (`supplier_id`, `name`, `contact_name`, `phone`, `email`, `address`, `is_active`) VALUES
(1, 'Xưởng Dệt May Cao Cấp Sài Gòn', 'Nguyễn Văn Hưng', '0912345678', 'hung.detmay@gmail.com', '45 Nguyễn Huệ, Quận 1, TP.HCM', 1),
(2, 'Lụa Tơ Tằm Thượng Hạng Hà Đông', 'Lê Thị Thu', '0987654321', 'thu.hadong@silk.vn', 'Làng lụa Vạn Phúc, Hà Đông, Hà Nội', 1),
(3, 'ÉLÉGANCE Global Sourcing', 'Michael Pham', '0903112233', 'sourcing@elegance.com', 'Khu Công Nghệ Cao, TP. Thủ Đức', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `products` (`product_id`, `category_id`, `brand_id`, `name`, `slug`, `description`, `base_price`, `thumbnail`, `has_variants`, `is_active`) VALUES
(1, 1, 1, 'Áo Sơ Mi Lụa ÉLÉGANCE Signature', 'ao-so-mi-lua-elegance-signature', 'Chiếc áo sơ mi lụa tơ tằm thượng hạng mang phong cách tối giản xa hoa, đường cắt may chuẩn Sharp Tailoring sắc sảo.', 1850000.00, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', 1, 1),
(2, 4, 1, 'Áo Khoác Blazer ÉLÉGANCE Modern Noir', 'ao-khoac-blazer-elegance-modern-noir', 'Blazer thiết kế phẳng tinh xảo, chất liệu len pha cashmere cao cấp giữ ấm và tạo form đứng đẳng cấp.', 3450000.00, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', 1, 1),
(3, 2, 1, 'Quần Tây May Đo Ý ÉLÉGANCE Tailored Trousers', 'quan-tay-may-do-y-elegance-tailored-trousers', 'Quần âu xếp ly phẳng tinh tế, vải wool dệt chéo thoáng khí chống nhăn tuyệt đối.', 1450000.00, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800', 1, 1),
(4, 3, 2, 'Đầm Dạ Hội Lụa Đỏ Bordeaux Dior Style', 'dam-da-hoi-lua-do-bordeaux-dior-style', 'Đầm dạ hội xếp nếp thủ công tôn dáng quyến rũ quý phái cho các buổi tiệc gala.', 4950000.00, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800', 1, 1),
(5, 5, 4, 'Thắt Lưng Da Bò Ý Khóa Bạc Nguyên Khối', 'that-lung-da-bo-y-khoa-bac-nguyen-khoi', 'Thắt lưng da thuộc thảo mộc nguyên bản kết hợp khóa mạ bạch kim bóng mờ.', 1200000.00, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800', 0, 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `product_images` (`image_id`, `product_id`, `image_url`, `sort_order`) VALUES
(1, 1, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800', 0),
(2, 1, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800', 1),
(3, 2, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', 0),
(4, 3, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800', 0),
(5, 4, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800', 0),
(6, 5, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800', 0)
ON DUPLICATE KEY UPDATE `image_url`=VALUES(`image_url`);

INSERT INTO `product_variants` (`variant_id`, `product_id`, `sku`, `color`, `size`, `price`, `stock_quantity`) VALUES
(1, 1, 'SGM-SILK-BLK-M', 'Đen Tuyền', 'M', 1850000.00, 45),
(2, 1, 'SGM-SILK-BLK-L', 'Đen Tuyền', 'L', 1850000.00, 30),
(3, 1, 'SGM-SILK-WHT-M', 'Trắng Ngọc Trai', 'M', 1850000.00, 50),
(4, 1, 'SGM-SILK-WHT-L', 'Trắng Ngọc Trai', 'L', 1850000.00, 25),
(5, 2, 'BLZ-NOIR-BLK-M', 'Đen Classic', 'M', 3450000.00, 20),
(6, 2, 'BLZ-NOIR-BLK-L', 'Đen Classic', 'L', 3450000.00, 15),
(7, 2, 'BLZ-NOIR-GRY-M', 'Xám Tro', 'M', 3450000.00, 18),
(8, 3, 'TRS-ITA-BLK-30', 'Đen', '30', 1450000.00, 40),
(9, 3, 'TRS-ITA-BLK-32', 'Đen', '32', 1450000.00, 35),
(10, 4, 'DRS-RED-BRD-S', 'Đỏ Bordeaux', 'S', 4950000.00, 12),
(11, 4, 'DRS-RED-BRD-M', 'Đỏ Bordeaux', 'M', 4950000.00, 10),
(12, 5, 'BLT-LTH-STD', 'Tiêu chuẩn', 'Tiêu chuẩn', 1200000.00, 60)
ON DUPLICATE KEY UPDATE `price`=VALUES(`price`);

INSERT INTO `purchase_receipts` (`receipt_id`, `receipt_code`, `supplier_id`, `created_by`, `total_cost`, `note`, `received_at`) VALUES
(1, 'REC-202610-001', 1, 2, 165000000.00, 'Lô hàng nhập đầu mùa Thu Đông 2026', NOW())
ON DUPLICATE KEY UPDATE `receipt_code`=VALUES(`receipt_code`);

INSERT INTO `purchase_receipt_items` (`receipt_item_id`, `receipt_id`, `variant_id`, `import_price`, `quantity`) VALUES
(1, 1, 1, 1100000.00, 50),
(2, 1, 3, 1100000.00, 50),
(3, 1, 5, 2200000.00, 25)
ON DUPLICATE KEY UPDATE `import_price`=VALUES(`import_price`);

INSERT INTO `carts` (`cart_id`, `user_id`) VALUES
(1, 3)
ON DUPLICATE KEY UPDATE `user_id`=VALUES(`user_id`);

INSERT INTO `cart_items` (`cart_item_id`, `cart_id`, `variant_id`, `quantity`) VALUES
(1, 1, 1, 1)
ON DUPLICATE KEY UPDATE `quantity`=VALUES(`quantity`);

INSERT INTO `orders` (`order_id`, `order_code`, `user_id`, `receiver_name`, `receiver_phone`, `shipping_address`, `total_amount`, `order_status`, `payment_method`, `payment_status`, `note`) VALUES
(1, 'ORD-202610-888', 3, 'Nguyễn Hoàng Long', '0900000003', '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', 3700000.00, 'DELIVERED', 'COD', 'PAID', 'Giao hàng giờ hành chính')
ON DUPLICATE KEY UPDATE `order_code`=VALUES(`order_code`);

INSERT INTO `order_items` (`order_item_id`, `order_id`, `variant_id`, `product_name`, `variant_sku`, `color`, `size`, `price`, `quantity`, `total_price`) VALUES
(1, 1, 1, 'Áo Sơ Mi Lụa ÉLÉGANCE Signature', 'SGM-SILK-BLK-M', 'Đen Tuyền', 'M', 1850000.00, 2, 3700000.00)
ON DUPLICATE KEY UPDATE `total_price`=VALUES(`total_price`);

INSERT INTO `product_reviews` (`review_id`, `product_id`, `user_id`, `order_id`, `rating`, `comment`) VALUES
(1, 1, 3, 1, 5, 'Chất lụa tơ tằm cực kỳ mềm mát và đứng form. Đóng hộp ÉLÉGANCE rất chỉn chu và sang trọng.'),
(2, 2, 3, 1, 5, 'Áo blazer cắt may chuẩn form, chất vải dầy dặn cao cấp, xứng đáng từng đồng.')
ON DUPLICATE KEY UPDATE `comment`=VALUES(`comment`);

INSERT INTO `blog_posts` (`post_id`, `author_id`, `title`, `slug`, `thumbnail`, `summary`, `content`, `is_published`) VALUES
(1, 1, 'Xu Hướng Thời Trang Tối Giản (Minimalist Luxury) Lên Ngôi 2026', 'xu-huong-thoi-trang-toi-gian-2026',
 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
 'Thời trang tối giản hiện đại không chỉ là cách ăn mặc, mà là một triết lý thẩm mỹ hướng tới chất liệu thuần khiết và phom dáng chuẩn mực.',
 '<p>Trong thế giới thời trang cao cấp năm 2026, chủ nghĩa tối giản (Minimalist Luxury) đã đạt đến một nấc thang mới...</p>', 1),
(2, 1, 'Nghệ Thuật May Đo Sharp Tailoring Trong Từng Đường Kim Mũi Chỉ', 'nghe-thuat-may-do-sharp-tailoring',
 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
 'Khám phá kỹ thuật dựng phom sắc nét tạo nên dấu ấn độc bản của nhà mốt ÉLÉGANCE.',
 '<p>Đằng sau mỗi chiếc áo blazer hay quần âu của ÉLÉGANCE là hàng trăm giờ hoàn thiện tỉ mỉ...</p>', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

