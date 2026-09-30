"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Row,
  Col,
  Form,
  Input,
  Radio,
  Button,
  Card,
  Spin,
  message,
  Modal,
} from "antd";
import {
  CheckCircleOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { authAPI, cartAPI, orderAPI, catalogAPI } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { authUtils } from "@/lib/auth";
import { formatPrice, PAYMENT_METHODS } from "@/lib/constants";
import type { UserAddress, CartItem, ProductVariant } from "@/lib/types";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, fetchCart } = useCart();
  const [form] = Form.useForm();

  // Buy Now params (if any)
  const buyNowVariantId = searchParams.get("variant_id");
  const buyNowQty = Number(searchParams.get("quantity")) || 1;

  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");
  const [paymentMethod, setPaymentMethod] = useState<string>("COD");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push("/login?redirect=/checkout");
      return;
    }

    async function loadData() {
      try {
        const addrRes = await authAPI.getAddresses();
        const aList = addrRes.data?.data || addrRes.data?.items || (Array.isArray(addrRes.data) ? addrRes.data : []);
        const addrs: UserAddress[] = Array.isArray(aList) ? aList : [];
        setAddresses(addrs);

        const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.address_id);
          form.setFieldsValue({
            receiver_name: defaultAddr.receiver_name,
            receiver_phone: defaultAddr.receiver_phone,
            shipping_address: `${defaultAddr.street_detail}, ${defaultAddr.ward}, ${defaultAddr.district}, ${defaultAddr.province}`,
          });
        } else {
          const user = authUtils.getUser();
          form.setFieldsValue({
            receiver_name: user?.full_name,
            receiver_phone: user?.phone_number,
          });
        }

        // Nếu là chế độ Mua ngay, lấy chi tiết biến thể
        if (buyNowVariantId) {
          // Fetch product containing variant or construct directly
          setBuyNowItem({
            variant_id: Number(buyNowVariantId),
            quantity: buyNowQty,
          });
        }
      } catch (e) {
        console.error("Lỗi khởi tạo checkout:", e);
      }
    }
    loadData();
  }, [router, buyNowVariantId, buyNowQty, form]);

  const handleAddressSelect = (addrId: number | "new") => {
    setSelectedAddressId(addrId);
    if (addrId === "new") {
      form.setFieldsValue({
        shipping_address: "",
      });
    } else {
      const addr = addresses.find((a) => a.address_id === addrId);
      if (addr) {
        form.setFieldsValue({
          receiver_name: addr.receiver_name,
          receiver_phone: addr.receiver_phone,
          shipping_address: `${addr.street_detail}, ${addr.ward}, ${addr.district}, ${addr.province}`,
        });
      }
    }
  };

  const handlePlaceOrder = async (values: any) => {
    try {
      setLoading(true);
      const payload: any = {
        receiver_name: values.receiver_name,
        receiver_phone: values.receiver_phone,
        shipping_address: values.shipping_address,
        payment_method: paymentMethod,
        note: values.note,
      };

      if (buyNowVariantId) {
        payload.items = [{ variant_id: Number(buyNowVariantId), quantity: buyNowQty }];
      }

      const res = await orderAPI.checkout(payload);
      setOrderSuccess(res.data);
      await fetchCart();
      message.success("Đặt hàng thành công!");
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Không thể hoàn tất đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const cartItems = cart?.items || [];
  const totalAmount = cart?.total_amount || 0;
  const isFreeShipping = totalAmount >= 1500000;
  const shippingFee = isFreeShipping ? 0 : 35000;
  const finalTotal = totalAmount + shippingFee;

  if (orderSuccess) {
    return (
      <MainLayout>
        <div style={{ maxWidth: 680, margin: "64px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: "48px 32px" }}>
            <CheckCircleOutlined style={{ fontSize: 56, color: "#059669", marginBottom: 20 }} />
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, margin: "0 0 12px" }}>
              Cảm Ơn Quý Khách Đã Đặt Hàng!
            </h1>
            <p style={{ color: "#71717A", fontSize: 14, margin: "0 0 24px" }}>
              Mã đơn hàng của bạn là: <b>{orderSuccess.order_code}</b>. Đơn hàng đang được bộ phận vận hành chuẩn bị và đóng gói cẩn thận.
            </p>

            {paymentMethod === "BANKING" && (
              <div style={{ background: "#FAF9F6", border: "1px dashed #C5A880", padding: "20px", marginBottom: 24, textAlign: "left" }}>
                <h4 style={{ margin: "0 0 12px", color: "#18181B", display: "flex", alignItems: "center", gap: 8 }}>
                  <QrcodeOutlined style={{ fontSize: 18, color: "#C5A880" }} /> Thông Tin Chuyển Khoản Ngân Hàng
                </h4>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: "#3F3F46" }}>
                  Ngân hàng: <b>MB BANK (Ngân hàng Quân Đội)</b><br />
                  Số tài khoản: <b>999988886666</b><br />
                  Chủ tài khoản: <b>MAISON ELEGANCE FASHION</b><br />
                  Số tiền: <b style={{ color: "#DC2626" }}>{formatPrice(orderSuccess.total_amount)}</b><br />
                  Nội dung chuyển khoản: <b>{orderSuccess.order_code}</b>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <Link href="/orders">
                <Button size="large" style={{ borderRadius: 0, padding: "0 24px" }}>
                  Xem Lịch Sử Đơn Hàng
                </Button>
              </Link>
              <Link href="/products">
                <Button type="primary" size="large" style={{ borderRadius: 0, background: "#18181B", padding: "0 24px" }}>
                  Tiếp Tục Mua Sắm
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 32, fontFamily: "Cormorant Garamond, serif", margin: "0 0 32px", color: "#18181B" }}>
          Thông Tin Thanh Toán & Đặt Hàng
        </h1>

        <Form form={form} layout="vertical" onFinish={handlePlaceOrder}>
          <Row gutter={[48, 32]}>
            {/* CỘT TRÁI: ĐỊA CHỈ & PHƯƠNG THỨC */}
            <Col xs={24} md={14}>
              {/* SỔ ĐỊA CHỈ */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: "24px", marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <EnvironmentOutlined style={{ color: "#C5A880" }} /> Địa Chỉ Giao Hàng
                </h3>

                {addresses.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: "#71717A", marginBottom: 8 }}>Chọn từ sổ địa chỉ đã lưu:</div>
                    <Radio.Group
                      value={selectedAddressId}
                      onChange={(e) => handleAddressSelect(e.target.value)}
                      style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                      {(Array.isArray(addresses) ? addresses : []).map((a) => (
                        <Radio
                          key={a.address_id}
                          value={a.address_id}
                          style={{
                            border: "1px solid #E4E4E7",
                            padding: "10px 14px",
                            background: selectedAddressId === a.address_id ? "#FAF9F6" : "#FFFFFF",
                          }}>
                          <div>
                            <b>{a.receiver_name}</b> ({a.receiver_phone})
                            {a.is_default && <span style={{ color: "#C5A880", marginLeft: 8, fontSize: 11 }}>[Mặc định]</span>}
                          </div>
                          <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>
                            {a.street_detail}, {a.ward}, {a.district}, {a.province}
                          </div>
                        </Radio>
                      ))}
                      <Radio value="new" style={{ border: "1px dashed #D4D4D8", padding: "10px 14px" }}>
                        + Nhập địa chỉ giao hàng khác
                      </Radio>
                    </Radio.Group>
                  </div>
                )}

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Họ và tên người nhận"
                      name="receiver_name"
                      rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
                      <Input size="large" style={{ borderRadius: 0 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Số điện thoại liên hệ"
                      name="receiver_phone"
                      rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}>
                      <Input size="large" style={{ borderRadius: 0 }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Địa chỉ nhận hàng chi tiết"
                  name="shipping_address"
                  rules={[{ required: true, message: "Vui lòng nhập địa chỉ nhận hàng" }]}>
                  <Input.TextArea rows={2} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..." style={{ borderRadius: 0 }} />
                </Form.Item>

                <Form.Item label="Ghi chú đơn hàng (Tùy chọn)" name="note">
                  <Input placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..." style={{ borderRadius: 0 }} />
                </Form.Item>
              </div>

              {/* PHƯƠNG THỨC THANH TOÁN */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: "24px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCardOutlined style={{ color: "#C5A880" }} /> Phương Thức Thanh Toán
                </h3>

                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
                  {PAYMENT_METHODS.map((pm) => (
                    <Radio
                      key={pm.id}
                      value={pm.id}
                      style={{
                        border: "1px solid #E4E4E7",
                        padding: "12px 16px",
                        background: paymentMethod === pm.id ? "#FAF9F6" : "#FFFFFF",
                      }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{pm.name}</div>
                      <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>{pm.desc}</div>
                    </Radio>
                  ))}
                </Radio.Group>
              </div>
            </Col>

            {/* CỘT PHẢI: TỔNG KẾT ĐƠN HÀNG */}
            <Col xs={24} md={10}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: "28px", position: "sticky", top: 96 }}>
                <h3 style={{ fontSize: 18, fontFamily: "serif", fontWeight: 600, margin: "0 0 20px" }}>
                  Mặt Hàng Thanh Toán
                </h3>

                {/* Danh sách tóm tắt */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 240, overflowY: "auto", marginBottom: 20 }}>
                  {cartItems.map((it) => (
                    <div key={it.cart_item_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{it.product_name}</div>
                        <div style={{ color: "#71717A", fontSize: 11 }}>
                          Màu: {it.color} | Size: {it.size} (x{it.quantity})
                        </div>
                      </div>
                      <div style={{ fontWeight: 600 }}>{formatPrice(it.subtotal)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid #F4F4F5", paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
                    <span style={{ color: "#71717A" }}>Tạm tính</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 14 }}>
                    <span style={{ color: "#71717A" }}>Phí vận chuyển</span>
                    <span>{isFreeShipping ? <b style={{ color: "#059669" }}>Miễn phí</b> : formatPrice(shippingFee)}</span>
                  </div>

                  <div style={{ borderTop: "1px solid #E4E4E7", paddingTop: 16, display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Tổng thanh toán</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "#18181B" }}>
                      {formatPrice(finalTotal)}
                    </span>
                  </div>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{
                      height: 52,
                      background: "#18181B",
                      borderColor: "#18181B",
                      borderRadius: 0,
                      fontWeight: 600,
                      fontSize: 14,
                      letterSpacing: "0.05em",
                    }}>
                    XÁC NHẬN ĐẶT HÀNG
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </MainLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
