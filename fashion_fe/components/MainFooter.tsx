import React from "react";
import Link from "next/link";
import { Input, Button } from "antd";

export default function MainFooter() {
  return (
    <footer style={{ background: "#0D0D0D", color: "#E5E5E5", paddingTop: 72, paddingBottom: 40, borderTop: "1px solid #1F1F1F" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 56, marginBottom: 56 }}>
          {/* Brand Col */}
          <div>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, fontWeight: 500, letterSpacing: "0.22em", textTransform: "uppercase", color: "#FFFFFF" }}>
              VINH STORE
            </span>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "#8F877F", textTransform: "uppercase", marginTop: 2, marginBottom: 16 }}>
              THỜI TRANG CAO CẤP
            </div>
            <p style={{ color: "#737373", fontSize: 13, lineHeight: 1.8, margin: 0, maxWidth: 300 }}>
              Hệ thống thời trang tôn vinh phong cách tinh tế, sự sang trọng và chuẩn mực may đo tinh xảo vượt thời gian.
            </p>
            <div style={{ color: "#8F877F", fontSize: 12, marginTop: 20, lineHeight: 1.7 }}>
              <div>28 Tràng Tiền, Hoàn Kiếm, Hà Nội</div>
              <div>88 Đồng Khởi, Quận 1, TP. Hồ Chí Minh</div>
              <div style={{ marginTop: 4 }}>hotro@vinhstore.vn</div>
            </div>
          </div>

          {/* Catalog Col */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>
              Danh Mục
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <Link href="/products?category_id=1" style={{ color: "#737373", textDecoration: "none", transition: "color 0.2s" }}>Thời Trang Nam</Link>
              <Link href="/products?category_id=2" style={{ color: "#737373", textDecoration: "none", transition: "color 0.2s" }}>Thời Trang Nữ</Link>
              <Link href="/products?category_id=5" style={{ color: "#737373", textDecoration: "none", transition: "color 0.2s" }}>Blazer & Suit May Đo</Link>
              <Link href="/products?category_id=3" style={{ color: "#737373", textDecoration: "none", transition: "color 0.2s" }}>Phụ Kiện Da Thuần Chủng</Link>
              <Link href="/products?sort=newest" style={{ color: "#E5E5E5", textDecoration: "none", transition: "color 0.2s" }}>Bộ Sưu Tập Mới Nhất</Link>
            </div>
          </div>

          {/* Customer Care Col */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>
              Dịch Vụ Khách Hàng
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <Link href="/orders" style={{ color: "#737373", textDecoration: "none", transition: "color 0.2s" }}>Tra Cứu Đơn Hàng</Link>
              <Link href="/news" style={{ color: "#737373", textDecoration: "none", transition: "color 0.2s" }}>Hướng Dẫn Chọn Size Chuẩn</Link>
              <span style={{ color: "#737373" }}>Chính Sách Đổi Trả 30 Ngày</span>
              <span style={{ color: "#737373" }}>Bảo Quản Chất Liệu Cashmere & Lụa</span>
              <span style={{ color: "#737373" }}>Dịch Vụ Chỉnh Sửa May Đo Riêng</span>
            </div>
          </div>

          {/* Newsletter Subscribe */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20, fontWeight: 600 }}>
              Bản Tin Thời Trang
            </h4>
            <p style={{ color: "#737373", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Đăng ký để nhận thông tin về các bộ sưu tập giới hạn và lời mời tham dự sự kiện thời trang độc quyền.
            </p>
            <div style={{ display: "flex", gap: 0 }}>
              <Input
                placeholder="Địa chỉ email của bạn..."
                style={{
                  background: "#171717",
                  border: "1px solid #27272A",
                  color: "#FFFFFF",
                  borderRadius: 0,
                  fontSize: 13,
                }}
              />
              <Button
                type="primary"
                style={{
                  background: "#FFFFFF",
                  color: "#0D0D0D",
                  border: "1px solid #FFFFFF",
                  borderRadius: 0,
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                Gửi
              </Button>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #1F1F1F",
            paddingTop: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#525252",
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
