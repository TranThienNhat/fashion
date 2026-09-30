// Types cho Fashion E-Commerce

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  is_active: boolean;
  created_at?: string;
}

export interface UserAddress {
  address_id: number;
  user_id: number;
  receiver_name: string;
  receiver_phone: string;
  province: string;
  district: string;
  ward: string;
  street_detail: string;
  is_default: boolean;
}

export interface Category {
  category_id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  is_active: boolean;
  parent_name?: string;
  children?: Category[];
}

export interface Brand {
  brand_id: number;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface ProductVariant {
  variant_id: number;
  product_id?: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  stock_quantity: number;
}

export interface ProductImage {
  image_id: number;
  product_id?: number;
  image_url: string;
  sort_order: number;
}

export interface Product {
  product_id: number;
  category_id: number;
  brand_id?: number;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  thumbnail?: string;
  is_active: boolean;
  created_at?: string;
  category_name?: string;
  category_slug?: string;
  brand_name?: string;
  brand_slug?: string;
  brand_logo?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  available_colors?: string[];
  available_sizes?: string[];
  total_stock?: number;
  rating?: number;
  review_count?: number;
}

export interface CartItem {
  cart_item_id: number;
  cart_id: number;
  variant_id: number;
  quantity: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  stock_quantity: number;
  product_id: number;
  product_name: string;
  thumbnail?: string;
  subtotal: number;
}

export interface Cart {
  cart_id: number;
  items: CartItem[];
  total_quantity: number;
  total_amount: number;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  variant_id: number;
  product_name: string;
  variant_sku: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  total_price: number;
  thumbnail?: string;
}

export interface Order {
  order_id: number;
  order_code: string;
  user_id: number;
  receiver_name: string;
  receiver_phone: string;
  shipping_address: string;
  total_amount: number;
  order_status: "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  payment_method: "COD" | "VNPAY" | "MOMO" | "BANKING";
  payment_status: "UNPAID" | "PAID" | "REFUNDED";
  transaction_code?: string;
  paid_at?: string;
  note?: string;
  created_at: string;
  items?: OrderItem[];
  total_items?: number;
  user_email?: string;
}

export interface ProductReview {
  review_id: number;
  product_id: number;
  product_name?: string;
  thumbnail?: string;
  user_id?: number;
  user_name: string;
  user_email?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface BlogPost {
  post_id: number;
  author_id?: number;
  author_name?: string;
  title: string;
  slug: string;
  thumbnail?: string;
  summary?: string;
  content: string;
  is_published: boolean;
  created_at: string;
}

export interface Supplier {
  supplier_id: number;
  name: string;
  contact_name?: string;
  phone: string;
  email?: string;
  address?: string;
  is_active: boolean;
}

export interface PurchaseReceiptItem {
  receipt_item_id: number;
  receipt_id: number;
  variant_id: number;
  sku?: string;
  color?: string;
  size?: string;
  product_name?: string;
  import_price: number;
  quantity: number;
}

export interface PurchaseReceipt {
  receipt_id: number;
  receipt_code: string;
  supplier_id: number;
  supplier_name?: string;
  supplier_phone?: string;
  created_by: number;
  creator_name?: string;
  total_cost: number;
  note?: string;
  received_at: string;
  total_items?: number;
  items?: PurchaseReceiptItem[];
}

export interface DashboardSummary {
  total_revenue: number;
  total_import_cost: number;
  gross_profit: number;
  total_orders: number;
  total_receipts: number;
  total_products: number;
  total_customers: number;
  low_stock_count: number;
}

export interface Banner {
  id?: number;
  tieu_de?: string;
  hinh_anh?: string;
  hinh_anh_url?: string;
  link?: string;
  vi_tri?: number;
  thu_tu?: number;
  trang_thai?: boolean;
}

export type SanPham = any;
export type NguoiDung = any;
export type DanhMuc = any;
export type DonHang = any;
export type TinTuc = any;

