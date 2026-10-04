
-- =============================================================================
-- 1. MODULE: USERS & ĐỊA CHỈ
-- =============================================================================

CREATE TABLE `users` (
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
    `district` VARCHAR(100) NOT NULL,
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
    `slug` VARCHAR(120) NOT NULL UNIQUE,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) 
        REFERENCES `categories`(`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `brands` (
    `brand_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(120) NOT NULL UNIQUE,
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

