import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động đính kèm token từ Cookie hoặc LocalStorage vào header
api.interceptors.request.use((config: any) => {
  const token = Cookies.get("token") || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// 1. AUTH & USER APIS
// ============================================================================
export const authAPI = {
  register: (data: { full_name: string; email: string; phone_number: string; password: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { account?: string; email?: string; password: string }) =>
    api.post("/api/auth/login", data),
  getMe: () => api.get("/api/auth/me"),
  updateProfile: (data: { full_name?: string; phone_number?: string }) =>
    api.put("/api/users/profile", data),
  getAddresses: () => api.get("/api/users/addresses"),
  addAddress: (data: any) => api.post("/api/users/addresses", data),
  updateAddress: (id: number, data: any) => api.put(`/api/users/addresses/${id}`, data),
  deleteAddress: (id: number) => api.delete(`/api/users/addresses/${id}`),
  setDefaultAddress: (id: number) => api.put(`/api/users/addresses/${id}/default`),
  // Admin
  adminGetUsers: (params?: { page?: number; size?: number; search?: string; role?: string }) =>
    api.get("/api/admin/users", { params }),
  adminToggleStatus: (userId: number, is_active: boolean) =>
    api.put(`/api/admin/users/${userId}/status`, { is_active }),
};

// ============================================================================
// 2. CATALOG APIS (CATEGORIES, BRANDS, PRODUCTS, VARIANTS)
// ============================================================================
export const catalogAPI = {
  getCategories: () => api.get("/api/categories"),
  getBrands: () => api.get("/api/brands"),
  getProducts: (params?: {
    category_id?: number | string;
    brand_id?: number | string;
    min_price?: number;
    max_price?: number;
    color?: string;
    size?: string;
    clothing_size?: string;
    search?: string;
    sort?: string;
    page?: number;
    page_size?: number;
    limit?: number;
  }) => api.get("/api/products", { params }),
  getNewArrivals: (limit = 8) => api.get("/api/products/new-arrivals", { params: { limit } }),
  getFeatured: (limit = 8) => api.get("/api/products/featured", { params: { limit } }),
  getProductDetail: (id: number) => api.get(`/api/products/${id}`),

  // Admin
  adminGetProducts: (params?: { page?: number; size?: number; search?: string }) =>
    api.get("/api/admin/products", { params }),
  adminCreateProduct: (data: any) => api.post("/api/admin/products", data),
  adminUpdateProduct: (id: number, data: any) => api.put(`/api/admin/products/${id}`, data),
  adminDeleteProduct: (id: number) => api.delete(`/api/admin/products/${id}`),

  adminCreateCategory: (data: any) => api.post("/api/admin/categories", data),
  adminUpdateCategory: (id: number, data: any) => api.put(`/api/admin/categories/${id}`, data),
  adminDeleteCategory: (id: number) => api.delete(`/api/admin/categories/${id}`),

  adminCreateBrand: (data: any) => api.post("/api/admin/brands", data),
  adminUpdateBrand: (id: number, data: any) => api.put(`/api/admin/brands/${id}`, data),
  adminDeleteBrand: (id: number) => api.delete(`/api/admin/brands/${id}`),
};

// ============================================================================
// 3. CART APIS
// ============================================================================
export const cartAPI = {
  getCart: () => api.get("/api/cart"),
  addToCart: (variant_id: number, quantity = 1) => api.post("/api/cart/add", { variant_id, quantity }),
  updateQuantity: (cart_item_id: number, quantity: number) =>
    api.put(`/api/cart/items/${cart_item_id}`, { quantity }),
  removeItem: (cart_item_id: number) => api.delete(`/api/cart/items/${cart_item_id}`),
  clearCart: () => api.delete("/api/cart/clear"),
};

// ============================================================================
// 4. ORDER APIS
// ============================================================================
export const orderAPI = {
  checkout: (data: {
    receiver_name: string;
    receiver_phone: string;
    shipping_address: string;
    payment_method: string;
    note?: string;
    items?: Array<{ variant_id: number; quantity: number }>;
  }) => api.post("/api/orders/checkout", data),
  getMyOrders: () => api.get("/api/orders/my-orders"),
  getOrderDetail: (id: number) => api.get(`/api/orders/${id}`),
  cancelOrder: (id: number) => api.put(`/api/orders/${id}/cancel`),

  // Admin
  adminGetOrders: (params?: { page?: number; size?: number; status?: string; payment_status?: string; search?: string }) =>
    api.get("/api/admin/orders", { params }),
  adminUpdateStatus: (orderId: number, order_status: string) =>
    api.put(`/api/admin/orders/${orderId}/status`, { order_status }),
  adminUpdatePayment: (orderId: number, payment_status: string, transaction_code?: string) =>
    api.put(`/api/admin/orders/${orderId}/payment`, { payment_status, transaction_code }),
};

// ============================================================================
// 5. WAREHOUSE & SUPPLIERS APIS
// ============================================================================
export const warehouseAPI = {
  adminGetSuppliers: (params?: { search?: string }) => api.get("/api/admin/suppliers", { params }),
  adminCreateSupplier: (data: any) => api.post("/api/admin/suppliers", data),
  adminUpdateSupplier: (id: number, data: any) => api.put(`/api/admin/suppliers/${id}`, data),
  adminDeleteSupplier: (id: number) => api.delete(`/api/admin/suppliers/${id}`),

  adminGetReceipts: (params?: { page?: number; size?: number; search?: string }) =>
    api.get("/api/admin/receipts", { params }),
  adminGetReceiptDetail: (id: number) => api.get(`/api/admin/receipts/${id}`),
  adminCreateReceipt: (data: {
    supplier_id: number;
    note?: string;
    items: Array<{ variant_id: number; import_price: number; quantity: number }>;
  }) => api.post("/api/admin/receipts", data),
};

// ============================================================================
// 6. REVIEWS & BLOG APIS
// ============================================================================
export const reviewBlogAPI = {
  getProductReviews: (productId: number) => api.get(`/api/products/${productId}/reviews`),
  submitReview: (data: { product_id: number; order_id?: number; rating: number; comment?: string }) =>
    api.post("/api/reviews", data),
  adminGetReviews: (params?: { page?: number; size?: number }) => api.get("/api/admin/reviews", { params }),
  adminDeleteReview: (id: number) => api.delete(`/api/admin/reviews/${id}`),

  getBlogPosts: (params?: { page?: number; size?: number }) => api.get("/api/blog", { params }),
  getBlogDetail: (slug: string) => api.get(`/api/blog/${slug}`),
  adminGetBlogPosts: (params?: { page?: number; size?: number; search?: string }) =>
    api.get("/api/admin/blog", { params }),
  adminCreateBlog: (data: any) => api.post("/api/admin/blog", data),
  adminUpdateBlog: (id: number, data: any) => api.put(`/api/admin/blog/${id}`, data),
  adminToggleBlogStatus: (id: number, is_published: boolean) =>
    api.put(`/api/admin/blog/${id}/status`, { is_published }),
  adminDeleteBlog: (id: number) => api.delete(`/api/admin/blog/${id}`),
};

// ============================================================================
// 7. REPORTS & ANALYTICS APIS
// ============================================================================
export const reportAPI = {
  getDashboardSummary: () => api.get("/api/admin/reports/dashboard"),
  getRevenueByTime: (period: "day" | "month" = "day") =>
    api.get("/api/admin/reports/revenue-time", { params: { period } }),
  getOrderStatusDistribution: () => api.get("/api/admin/reports/order-status"),
  getLowStockWarning: (threshold = 10) =>
    api.get("/api/admin/reports/low-stock", { params: { threshold } }),
};

// ============================================================================
// 8. UPLOAD APIS
// ============================================================================
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    return api.post("/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getUploadedImages: () => api.get("/upload/images"),
};

// Legacy Compatibility APIs for leftover components
export const bannerAPI = {
  layTheoViTri: (viTri: number) => api.get(`/api/banner/vitri/${viTri}`).catch(() => ({ data: [] })),
  layTatCa: () => api.get("/api/banner").catch(() => ({ data: [] })),
  them: (data: any) => api.post("/api/banner", data),
  sua: (id: number, data: any) => api.put(`/api/banner/${id}`, data),
  xoa: (id: number) => api.delete(`/api/banner/${id}`),
  capNhatTrangThai: (id: number, data: any) => api.put(`/api/banner/${id}/trangthai`, data),
};

export const tinTucAPI = {
  layTatCa: (params?: any) => reviewBlogAPI.getBlogPosts(params),
  layNoiBat: (limit?: number) => reviewBlogAPI.getBlogPosts({ page: 0, size: limit || 6 }),
  layTheoId: (id: number) => reviewBlogAPI.getBlogDetail(String(id)),
  them: (data: any) => reviewBlogAPI.adminCreateBlog(data),
  sua: (id: number, data: any) => reviewBlogAPI.adminUpdateBlog(id, data),
  xoa: (id: number) => reviewBlogAPI.adminDeleteBlog(id),
};

export const sanPhamAPI = {
  layTatCa: (params?: any) => catalogAPI.getProducts(params),
  layTheoId: (id: number) => catalogAPI.getProductDetail(id),
  layNoiBat: (limit?: number) => catalogAPI.getFeatured(limit),
  layHinhAnh: (id: number) => api.get(`/api/products/${id}`).then((r) => ({ data: r.data.images || [] })),
};

export const gioHangAPI = {
  layGioHang: () => cartAPI.getCart(),
  themSanPham: (_userId: any, data: any) => cartAPI.addToCart(data.ma_san_pham || data.variant_id, data.so_luong),
  capNhatSoLuong: (id: number, data: any) => cartAPI.updateQuantity(id, data.so_luong),
  xoaSanPham: (id: number) => cartAPI.removeItem(id),
};

export const donHangAPI = {
  layTatCa: () => orderAPI.getMyOrders(),
  layTheoId: (id: number) => orderAPI.getOrderDetail(id),
};

export default api;

