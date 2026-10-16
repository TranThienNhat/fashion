"use client";

import React from "react";
import { Drawer, Button, Empty, Space } from "antd";
import { DeleteOutlined, ShoppingOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";

export default function CartDrawer() {
  const { cart, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeFromCart } = useCart();

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const totalAmount = cart?.total_amount || 0;

  return (
    <Drawer
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "serif", fontSize: "20px", fontWeight: 600 }}>
            Túi Mua Sắm ({cart?.total_quantity || 0})
          </span>
        </div>
      }
      placement="right"
      width={420}
      onClose={() => setIsDrawerOpen(false)}
      open={isDrawerOpen}
      footer={
        items.length > 0 ? (
          <div style={{ padding: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--fashion-muted)" }}>Tạm tính:</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--fashion-black)" }}>
                {formatPrice(totalAmount)}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--fashion-muted)", marginBottom: 16 }}>
              Phí vận chuyển và mã ưu đãi sẽ được áp dụng khi thanh toán.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/cart" style={{ flex: 1 }} onClick={() => setIsDrawerOpen(false)}>
                <Button block size="large" style={{ borderRadius: 2, borderColor: "var(--fashion-border)" }}>
                  Xem Giỏ Hàng
                </Button>
              </Link>
              <Link href="/checkout" style={{ flex: 1 }} onClick={() => setIsDrawerOpen(false)}>
                <Button
                  block
                  type="primary"
                  size="large"
                  style={{
                    background: "var(--fashion-black)",
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                  icon={<ArrowRightOutlined />}>
                  Thanh Toán
                </Button>
              </Link>
            </div>
          </div>
        ) : null
      }>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Túi mua sắm của bạn đang trống"
          />
          <Link href="/products" onClick={() => setIsDrawerOpen(false)}>
            <Button
              type="primary"
              size="large"
              style={{ marginTop: 16, background: "var(--fashion-accent)", borderColor: "var(--fashion-accent)", borderRadius: 2 }}
              icon={<ShoppingOutlined />}>
              Khám Phá Bộ Sưu Tập
            </Button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {items.map((item) => (
            <div
              key={item.cart_item_id}
              style={{
                display: "flex",
                gap: 14,
                paddingBottom: 16,
                borderBottom: "1px solid var(--fashion-border)",
              }}>
              <div
                style={{
                  width: 80,
                  height: 100,
                  position: "relative",
                  background: "var(--fashion-surface)",
                  borderRadius: 2,
                  overflow: "hidden",
                  flexShrink: 0,
                }}>

                <img
                  src={item.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200"}
                  alt={item.product_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--fashion-black)" }}>
                      {item.product_name}
                    </h4>
                    <button
                      onClick={() => removeFromCart(item.cart_item_id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--fashion-muted)",
                        padding: 2,
                      }}>
                      <DeleteOutlined />
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fashion-muted)", marginTop: 4 }}>
                    Màu: <b>{item.color}</b> | Size: <b>{item.size}</b>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid var(--fashion-border)",
                      borderRadius: 2,
                    }}>
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                      style={{
                        width: 26,
                        height: 26,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "var(--fashion-black)",
                      }}>
                      -
                    </button>
                    <span style={{ padding: "0 8px", fontSize: 12, fontWeight: 600, color: "var(--fashion-black)" }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                      style={{
                        width: 26,
                        height: 26,
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "var(--fashion-black)",
                      }}>
                      +
                    </button>
                  </div>

                  <span style={{ fontWeight: 600, color: "var(--fashion-accent)", fontSize: 14 }}>
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
