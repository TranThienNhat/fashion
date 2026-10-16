"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Row, Col, Button, Empty, Spin } from "antd";
import { DeleteOutlined, ArrowRightOutlined, ShoppingOutlined } from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { useCart } from "@/contexts/CartContext";
import { authUtils } from "@/lib/auth";
import { formatPrice } from "@/lib/constants";

export default function CartPage() {
  const router = useRouter();
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push("/login?redirect=/cart");
    }
  }, [router]);

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const totalAmount = cart?.total_amount || 0;
  const isFreeShipping = totalAmount >= 1500000;
  const shippingFee = items.length === 0 || isFreeShipping ? 0 : 35000;
  const finalTotal = totalAmount + shippingFee;

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "120px 0" }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 36, fontFamily: "Cormorant Garamond, serif", margin: "0 0 32px", color: "var(--fashion-black)" }}>
          Túi Mua Sắm Của Bạn ({cart?.total_quantity || 0})
        </h1>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--fashion-surface-card)", border: "1px solid var(--fashion-border)", borderRadius: "var(--fashion-radius-sm)" }}>
            <Empty description={<span style={{ color: "var(--fashion-muted)" }}>Túi mua sắm hiện chưa có sản phẩm nào</span>} />
            <Link href="/products">
              <Button
                type="primary"
                size="large"
                style={{ marginTop: 20, background: "var(--fashion-black)", borderColor: "var(--fashion-black)", color: "#FAF8F5", borderRadius: "var(--fashion-radius-sm)", padding: "0 32px" }}
                icon={<ShoppingOutlined />}>
                Khám Phá Bộ Sưu Tập Mới
              </Button>
            </Link>
          </div>
        ) : (
          <Row gutter={[48, 32]}>
            {/* DANH SÁCH MẶT HÀNG */}
            <Col xs={24} lg={16}>
              <div style={{ background: "var(--fashion-surface-card)", border: "1px solid var(--fashion-border)", borderRadius: "var(--fashion-radius-sm)", padding: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "3fr 1fr 1fr 1fr auto",
                    paddingBottom: 16,
                    borderBottom: "1px solid var(--fashion-border)",
                    fontSize: 12,
                    color: "var(--fashion-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>
                  <span>Sản Phẩm</span>
                  <span style={{ textAlign: "center" }}>Đơn Giá</span>
                  <span style={{ textAlign: "center" }}>Số Lượng</span>
                  <span style={{ textAlign: "right" }}>Thành Tiền</span>
                  <span></span>
                </div>

                {items.map((item) => (
                  <div
                    key={item.cart_item_id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "3fr 1fr 1fr 1fr auto",
                      alignItems: "center",
                      padding: "20px 0",
                      borderBottom: "1px solid var(--fashion-border)",
                    }}>
                    {/* Ảnh & Tên */}
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 70, height: 90, background: "var(--fashion-surface)", borderRadius: "var(--fashion-radius-sm)", overflow: "hidden", flexShrink: 0 }}>
                        <img
                          src={item.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200"}
                          alt={item.product_name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div>
                        <Link href={`/products/${item.product_id}`} style={{ textDecoration: "none", color: "var(--fashion-black)", fontWeight: 600, fontSize: 14 }}>
                          {item.product_name}
                        </Link>
                        <div style={{ fontSize: 12, color: "var(--fashion-muted)", marginTop: 4 }}>
                          Màu: <b style={{ color: "var(--fashion-black)" }}>{item.color}</b> | Size: <b style={{ color: "var(--fashion-black)" }}>{item.size}</b>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--fashion-muted)", marginTop: 2 }}>
                          SKU: {item.sku}
                        </div>
                      </div>
                    </div>

                    {/* Đơn giá */}
                    <div style={{ textAlign: "center", fontSize: 14, color: "var(--fashion-body)" }}>
                      {formatPrice(item.price)}
                    </div>

                    {/* Bộ tăng giảm số lượng */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ display: "flex", border: "1px solid var(--fashion-border)", borderRadius: "var(--fashion-radius-sm)", background: "var(--fashion-surface)" }}>
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                          style={{ width: 28, height: 30, border: "none", background: "none", cursor: "pointer", color: "var(--fashion-black)" }}>
                          -
                        </button>
                        <span style={{ width: 32, textAlign: "center", lineHeight: "30px", fontSize: 13, fontWeight: 600, color: "var(--fashion-black)" }}>
                          {item.quantity}
                        </span>
                        <button
                          disabled={item.quantity >= item.stock_quantity}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          style={{ width: 28, height: 30, border: "none", background: "none", cursor: "pointer", color: "var(--fashion-black)" }}>
                          +
                        </button>
                      </div>
                    </div>

                    {/* Thành tiền */}
                    <div style={{ textAlign: "right", fontSize: 15, fontWeight: 700, color: "var(--fashion-black)" }}>
                      {formatPrice(item.subtotal)}
                    </div>

                    {/* Xóa */}
                    <div style={{ textAlign: "right", paddingLeft: 12 }}>
                      <button
                        onClick={() => removeFromCart(item.cart_item_id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fashion-muted)" }}>
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                  <Link href="/products">
                    <Button style={{ borderRadius: "var(--fashion-radius-sm)", borderColor: "var(--fashion-border)", color: "var(--fashion-black)" }}>← Tiếp tục mua sắm</Button>
                  </Link>
                  <Button danger type="text" onClick={clearCart}>
                    Xóa tất cả sản phẩm
                  </Button>
                </div>
              </div>
            </Col>

            {/* BẢNG TỔNG KẾT ĐƠN HÀNG */}
            <Col xs={24} lg={8}>
              <div style={{ background: "var(--fashion-surface-card)", border: "1px solid var(--fashion-border)", borderRadius: "var(--fashion-radius-sm)", padding: "28px" }}>
                <h3 style={{ fontSize: 18, fontFamily: "Cormorant Garamond, serif", fontWeight: 600, margin: "0 0 20px", color: "var(--fashion-black)" }}>
                  Tổng Kết Đơn Hàng
                </h3>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: "var(--fashion-muted)" }}>Tạm tính</span>
                  <span style={{ fontWeight: 600, color: "var(--fashion-black)" }}>{formatPrice(totalAmount)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14 }}>
                  <span style={{ color: "var(--fashion-muted)" }}>Phí vận chuyển</span>
                  <span>{isFreeShipping ? <b style={{ color: "#2E7D32" }}>Miễn phí</b> : formatPrice(shippingFee)}</span>
                </div>

                {!isFreeShipping && (
                  <div style={{ background: "rgba(168, 110, 75, 0.12)", border: "1px solid rgba(168, 110, 75, 0.2)", borderRadius: "var(--fashion-radius-sm)", padding: "8px 12px", fontSize: 12, color: "#784423", marginBottom: 16 }}>
                    Mua thêm {formatPrice(1500000 - totalAmount)} để được <b>MIỄN PHÍ VẬN CHUYỂN</b>
                  </div>
                )}

                <div style={{ borderTop: "1px solid var(--fashion-border)", paddingTop: 16, display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "var(--fashion-black)" }}>Tổng thanh toán</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--fashion-black)" }}>
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                <Link href="/checkout">
                  <Button
                    type="primary"
                    block
                    size="large"
                    style={{
                      height: 50,
                      background: "var(--fashion-black)",
                      borderColor: "var(--fashion-black)",
                      color: "#FAF8F5",
                      borderRadius: "var(--fashion-radius-sm)",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                    }}
                    icon={<ArrowRightOutlined />}>
                    TIẾN HÀNH THANH TOÁN
                  </Button>
                </Link>

                <div style={{ marginTop: 20, fontSize: 12, color: "var(--fashion-muted)", lineHeight: 1.6 }}>
                  • Thanh toán an toàn và bảo mật<br />
                  • Hỗ trợ thanh toán khi nhận hàng (COD) hoặc Chuyển khoản QR<br />
                  • Đổi trả trong 30 ngày nếu không ưng ý
                </div>
              </div>
            </Col>
          </Row>
        )}
      </div>
    </MainLayout>
  );
}
