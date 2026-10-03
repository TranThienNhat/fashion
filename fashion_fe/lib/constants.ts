// Constants & Helpers cho Fashion E-Commerce

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
};

// Format tiền tệ Việt Nam (VNĐ)
export const formatPrice = (price: number | string | undefined | null): string => {
  const num = Number(price) || 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
};

// Trạng thái đơn hàng
export const ORDER_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Chờ xử lý", color: "#D97706", bg: "#FEF3C7" },
  CONFIRMED: { label: "Đã xác nhận", color: "#2563EB", bg: "#DBEAFE" },
  SHIPPING: { label: "Đang giao hàng", color: "#7C3AED", bg: "#EDE9FE" },
  DELIVERED: { label: "Giao thành công", color: "#059669", bg: "#D1FAE5" },
  CANCELLED: { label: "Đã hủy đơn", color: "#DC2626", bg: "#FEE2E2" },
};

// Trạng thái thanh toán
export const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  UNPAID: { label: "Chưa thanh toán", color: "#DC2626", bg: "#FEE2E2" },
  PAID: { label: "Đã thanh toán", color: "#059669", bg: "#D1FAE5" },
  REFUNDED: { label: "Đã hoàn tiền", color: "#4B5563", bg: "#F3F4F6" },
};

// Phương thức thanh toán (chỉ hỗ trợ COD theo yêu cầu hệ thống)
export const PAYMENT_METHODS = [
  { id: "COD", name: "Thanh toán khi nhận hàng (COD)", desc: "Nhận hàng kiểm tra và thanh toán trực tiếp tiền mặt cho nhân viên giao hàng" },
];

// Danh sách màu sắc thời trang thông dụng
export const POPULAR_COLORS = [
  { name: "Đen", hex: "#18181B" },
  { name: "Trắng", hex: "#FFFFFF" },
  { name: "Be", hex: "#E5D9C5" },
  { name: "Xanh Navy", hex: "#1E3A8A" },
  { name: "Nâu", hex: "#78350F" },
  { name: "Xám", hex: "#9CA3AF" },
  { name: "Đỏ Rượu", hex: "#881337" },
  { name: "Hồng", hex: "#F472B6" },
  { name: "Xanh Olive", hex: "#3F6212" },
];

// Danh sách kích thước chuẩn
export const POPULAR_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Freesize"];
