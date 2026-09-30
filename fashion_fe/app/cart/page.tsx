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
        <h1 style={{ fontSize: 36, fontFamily: "Cormorant Garamond, serif", margin: "0 0 32px", color: "#18181B" }}>
          Túi Mua Sắm Của Bạn ({cart?.total_quantity || 0})
        </h1>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", background: "#FFFFFF", border: "1px solid #E4E4E7" }}>
            <Empty description="Túi mua sắm hiện chưa có sản phẩm nào" />
            <Link href="/products">
              <Button
                type="primary"
                size="large"
                style={{ marginTop: 20, background: "#18181B", borderRadius: 0, padding: "0 32px" }}
                icon={<ShoppingOutlined />}>
                Khám Phá Bộ Sưu Tập Mới
              </Button>
            </Link>
          </div>
        ) : (
          <Row gutter={[48, 32]}>
            {/* DANH SÁCH MẶT HÀNG */}
            <Col xs={24} lg={16}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: "24px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "3fr 1fr 1fr 1fr auto",
                    paddingBottom: 16,
                    borderBottom: "1px solid #E4E4E7",
                    fontSize: 12,
                    color: "#71717A",
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
                      borderBottom: "1px solid #F4F4F5",
                    }}>
                    {/* Ảnh & Tên */}
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 70, height: 90, background: "#F4F4F5", flexShrink: 0 }}>
                        <img
                          src={item.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200"}
                          alt={item.product_name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div>
                        <Link href={`/products/${item.product_id}`} style={{ textDecoration: "none", color: "#18181B", fontWeight: 600, fontSize: 14 }}>
                          {item.product_name}
                        </Link>
                        <div style={{ fontSize: 12, color: "#71717A", marginTop: 4 }}>
                          Màu: <b>{item.color}</b> | Size: <b>{item.size}</b>
                        </div>
                        <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>
                          SKU: {item.sku}
                        </div>
                      </div>
                    </div>

                    {/* Đơn giá */}
                    <div style={{ textAlign: "center", fontSize: 14, color: "#52525B" }}>
                      {formatPrice(item.price)}
                    </div>

                    {/* Bộ tăng giảm số lượng */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ display: "flex", border: "1px solid #E4E4E7" }}>
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                          style={{ width: 28, height: 30, border: "none", background: "none", cursor: "pointer" }}>
                          -
                        </button>
                        <span style={{ width: 32, textAlign: "center", lineHeight: "30px", fontSize: 13, fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          disabled={item.quantity >= item.stock_quantity}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          style={{ width: 28, height: 30, border: "none", background: "none", cursor: "pointer" }}>
                          +
                        </button>
                      </div>
                    </div>

                    {/* Thành tiền */}
                    <div style={{ textAlign: "right", fontSize: 15, fontWeight: 700, color: "#18181B" }}>
                      {formatPrice(item.subtotal)}
                    </div>

                    {/* Xóa */}
                    <div style={{ textAlign: "right", paddingLeft: 12 }}>
                      <button
                        onClick={() => removeFromCart(item.cart_item_id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#A1A1AA" }}>
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                  <Link href="/products">
                    <Button style={{ borderRadius: 0 }}>← Tiếp tục mua sắm</Button>
                  </Link>
                  <Button danger type="text" onClick={clearCart}>
                    Xóa tất cả sản phẩm
                  </Button>
                </div>
              </div>
            </Col>

            {/* BẢNG TỔNG KẾT ĐƠN HÀNG */}
            <Col xs={24} lg={8}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: "28px" }}>
                <h3 style={{ fontSize: 18, fontFamily: "serif", fontWeight: 600, margin: "0 0 20px" }}>
                  Tổng Kết Đơn Hàng
                </h3>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: "#71717A" }}>Tạm tính</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(totalAmount)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 14 }}>
                  <span style={{ color: "#71717A" }}>Phí vận chuyển</span>
                  <span>{isFreeShipping ? <b style={{ color: "#059669" }}>Miễn phí</b> : formatPrice(shippingFee)}</span>
                </div>

                {!isFreeShipping && (
                  <div style={{ background: "#FEF3C7", padding: "8px 12px", fontSize: 12, color: "#92400E", marginBottom: 16 }}>
                    Mua thêm {formatPrice(1500000 - totalAmount)} để được <b>MIỄN PHÍ VẬN CHUYỂN</b>
                  </div>
                )}

                <div style={{ borderTop: "1px solid #E4E4E7", paddingTop: 16, display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Tổng thanh toán</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#18181B" }}>
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
                      background: "#18181B",
                      borderColor: "#18181B",
                      borderRadius: 0,
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                    }}
                    icon={<ArrowRightOutlined />}>
                    TIẾN HÀNH THANH TOÁN
                  </Button>
                </Link>

                <div style={{ marginTop: 20, fontSize: 12, color: "#71717A", lineHeight: 1.6 }}>
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
