import React from "react";
import Link from "next/link";

export default function MainFooter() {
  return (
    <footer style={{ background: "#1F1B18", color: "#E8E2D8", paddingTop: 72, paddingBottom: 40, borderTop: "1px solid #332D27" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 56, marginBottom: 56 }}>
          {/* Brand Col */}
          <div>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FAF8F5" }}>
              VINH STORE
            </span>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#C5A880", textTransform: "uppercase", marginTop: 2, marginBottom: 16 }}>
              THỜI TRANG CAO CẤP
            </div>
            <p style={{ color: "#A89F94", fontSize: 13, lineHeight: 1.8, margin: 0, maxWidth: 300 }}>
              Hệ thống thời trang tôn vinh phong cách tinh tế, sự sang trọng và chuẩn mực may đo tinh xảo vượt thời gian.
            </p>
            <div style={{ color: "#A89F94", fontSize: 12, marginTop: 20, lineHeight: 1.7 }}>
              <div>28 Tràng Tiền, Hoàn Kiếm, Hà Nội</div>
              <div>88 Đồng Khởi, Quận 1, TP. Hồ Chí Minh</div>
              <div style={{ marginTop: 4, color: "#C5A880" }}>hotro@vinhstore.vn</div>
            </div>
          </div>

          {/* Catalog Col */}
          <div>
            <h4 style={{ color: "#FAF8F5", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>
              Danh Mục
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <Link href="/products?category_id=1" style={{ color: "#A89F94", textDecoration: "none", transition: "color 0.2s" }}>Thời Trang Nam</Link>
              <Link href="/products?category_id=2" style={{ color: "#A89F94", textDecoration: "none", transition: "color 0.2s" }}>Thời Trang Nữ</Link>
              <Link href="/products?category_id=5" style={{ color: "#A89F94", textDecoration: "none", transition: "color 0.2s" }}>Blazer & Suit May Đo</Link>
              <Link href="/products?category_id=3" style={{ color: "#A89F94", textDecoration: "none", transition: "color 0.2s" }}>Phụ Kiện Da Thuần Chủng</Link>
              <Link href="/products?sort=newest" style={{ color: "#E8E2D8", textDecoration: "none", transition: "color 0.2s" }}>Bộ Sưu Tập Mới Nhất</Link>
            </div>
          </div>

          {/* Customer Care Col */}
          <div>
            <h4 style={{ color: "#FAF8F5", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>
              Dịch Vụ Khách Hàng
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <Link href="/orders" style={{ color: "#A89F94", textDecoration: "none", transition: "color 0.2s" }}>Tra Cứu Đơn Hàng</Link>
              <Link href="/news" style={{ color: "#A89F94", textDecoration: "none", transition: "color 0.2s" }}>Hướng Dẫn Chọn Size Chuẩn</Link>
              <span style={{ color: "#A89F94" }}>Chính Sách Đổi Trả 30 Ngày</span>
              <span style={{ color: "#A89F94" }}>Bảo Quản Chất Liệu Cashmere & Lụa</span>
              <span style={{ color: "#A89F94" }}>Dịch Vụ Chỉnh Sửa May Đo Riêng</span>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #332D27",
            paddingTop: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#8A8075",
            flexWrap: "wrap",
            gap: 16,
          }}>
          <div>
            © {new Date().getFullYear()} VINH STORE. Bảo lưu mọi quyền. Phong cách thời trang cao cấp & thanh lịch.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <span style={{ cursor: "pointer" }}>Điều Khoản Sử Dụng</span>
            <span style={{ cursor: "pointer" }}>Chính Sách Bảo Mật</span>
            <span style={{ cursor: "pointer" }}>Chứng Nhận May Đo Thủ Công</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
