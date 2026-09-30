"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  Tag,
  Button,
  Steps,
  Modal,
  Rate,
  Input,
  Spin,
  Empty,
  message,
  Popconfirm,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  InboxOutlined,
  CloseCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { orderAPI, reviewBlogAPI } from "@/lib/api";
import { authUtils } from "@/lib/auth";
import { formatPrice, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "@/lib/constants";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Detail Modal state
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getMyOrders();
      const oList = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setOrders(Array.isArray(oList) ? oList : []);
    } catch {
      message.error("Lỗi khi tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push("/login?redirect=/orders");
      return;
    }
    fetchOrders();
  }, [router]);

  const handleCancelOrder = async (orderId: number) => {
    try {
      await orderAPI.cancelOrder(orderId);
      message.success("Đã hủy đơn hàng thành công và hoàn trả tồn kho");
      fetchOrders();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Không thể hủy đơn hàng");
    }
  };

  const handleOpenDetail = async (orderId: number) => {
    try {
      const res = await orderAPI.getOrderDetail(orderId);
      setSelectedDetailOrder(res.data);
      setIsDetailOpen(true);
    } catch {
      message.error("Lỗi khi lấy chi tiết đơn hàng");
    }
  };

  const handleOpenReview = async (order: Order) => {
    try {
      const res = await orderAPI.getOrderDetail(order.order_id);
      setReviewOrder(res.data);
      if (res.data.items && res.data.items.length > 0) {
        setSelectedProductId(res.data.items[0].product_id || res.data.items[0].variant_id);
      }
      setIsReviewOpen(true);
    } catch {
      message.error("Lỗi khi chuẩn bị đánh giá");
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedProductId) return;
    try {
      setSubmittingReview(true);
      await reviewBlogAPI.submitReview({
        product_id: selectedProductId,
        order_id: reviewOrder?.order_id,
        rating,
        comment,
      });
      message.success("Cảm ơn bạn đã gửi đánh giá sản phẩm!");
      setIsReviewOpen(false);
      setComment("");
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Lỗi khi gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStepCurrent = (status: string) => {
    switch (status) {
      case "PENDING": return 0;
      case "CONFIRMED": return 1;
      case "SHIPPING": return 2;
      case "DELIVERED": return 3;
      case "CANCELLED": return -1;
      default: return 0;
    }
  };

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
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 32, fontFamily: "Cormorant Garamond, serif", margin: "0 0 32px", color: "#18181B" }}>
          Đơn Mua Của Bạn ({orders.length})
        </h1>

        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", background: "#FFFFFF", border: "1px solid #E4E4E7" }}>
            <Empty description="Bạn chưa có đơn đặt hàng nào" />
            <Link href="/products">
              <Button type="primary" size="large" style={{ marginTop: 20, background: "#18181B", borderRadius: 0 }}>
                Mua Sắm Ngay
              </Button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {(Array.isArray(orders) ? orders : []).map((o) => {
              const statusCfg = ORDER_STATUS_MAP[o.order_status] || { label: o.order_status, color: "#71717A", bg: "#F4F4F5" };
              const payCfg = PAYMENT_STATUS_MAP[o.payment_status] || { label: o.payment_status, color: "#71717A", bg: "#F4F4F5" };
              const stepIdx = getStepCurrent(o.order_status);

              return (
                <div
                  key={o.order_id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E4E4E7",
                    padding: "24px",
                  }}>
                  {/* Header đơn */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingBottom: 16, borderBottom: "1px solid #F4F4F5" }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#18181B" }}>
                        ĐƠN HÀNG #{o.order_code}
                      </span>
                      <span style={{ fontSize: 12, color: "#71717A", marginLeft: 12 }}>
                        Ngày đặt: {new Date(o.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Tag style={{ borderRadius: 0, color: payCfg.color, background: payCfg.bg, borderColor: "transparent" }}>
                        {payCfg.label}
                      </Tag>
                      <Tag style={{ borderRadius: 0, color: statusCfg.color, background: statusCfg.bg, borderColor: "transparent", fontWeight: 600 }}>
                        {statusCfg.label}
                      </Tag>
                    </div>
                  </div>

                  {/* Thanh tiến trình trạng thái (Timeline) */}
                  {o.order_status !== "CANCELLED" ? (
                    <div style={{ padding: "28px 16px 16px" }}>
                      <Steps
                        current={stepIdx}
                        size="small"
                        items={[
                          { title: "Chờ xử lý", icon: <ClockCircleOutlined /> },
                          { title: "Đã xác nhận", icon: <CheckCircleOutlined /> },
                          { title: "Đang giao", icon: <CarOutlined /> },
                          { title: "Đã giao", icon: <InboxOutlined /> },
                        ]}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: "16px 0", color: "#DC2626", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <CloseCircleOutlined /> Đơn hàng đã bị hủy. Toàn bộ sản phẩm đã được tự động hoàn lại tồn kho.
                    </div>
                  )}

                  {/* Footer thông tin và thao tác */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #F4F4F5", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 13, color: "#71717A" }}>Tổng tiền thanh toán: </span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#18181B" }}>
                        {formatPrice(o.total_amount)}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 12 }}>
                      <Button onClick={() => handleOpenDetail(o.order_id)} style={{ borderRadius: 0 }}>
                        Chi Tiết Đơn Hàng
                      </Button>

                      {o.order_status === "PENDING" && (
                        <Popconfirm
                          title="Hủy đơn hàng?"
                          description="Bạn có chắc chắn muốn hủy đơn hàng này không?"
                          onConfirm={() => handleCancelOrder(o.order_id)}
                          okText="Hủy Đơn"
                          cancelText="Không">
                          <Button danger style={{ borderRadius: 0 }}>
                            Hủy Đơn
                          </Button>
                        </Popconfirm>
                      )}

                      {o.order_status === "DELIVERED" && (
                        <Button
                          type="primary"
                          onClick={() => handleOpenReview(o)}
                          style={{ borderRadius: 0, background: "#C5A880", borderColor: "#C5A880", color: "#18181B", fontWeight: 600 }}
                          icon={<StarOutlined />}>
                          Viết Đánh Giá
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Chi Tiết Đơn Hàng */}
        <Modal
          title={<span style={{ fontFamily: "serif", fontSize: 20 }}>Chi Tiết Đơn Hàng #{selectedDetailOrder?.order_code}</span>}
          open={isDetailOpen}
          onCancel={() => setIsDetailOpen(false)}
          footer={null}
          width={700}>
          {selectedDetailOrder && (
            <div style={{ padding: "12px 0" }}>
              <div style={{ background: "#FAF9F6", padding: 16, marginBottom: 20, fontSize: 13, lineHeight: 1.8 }}>
                <div><b>Người nhận:</b> {selectedDetailOrder.receiver_name} ({selectedDetailOrder.receiver_phone})</div>
                <div><b>Địa chỉ giao hàng:</b> {selectedDetailOrder.shipping_address}</div>
                <div><b>Phương thức thanh toán:</b> {selectedDetailOrder.payment_method}</div>
                {selectedDetailOrder.note && <div><b>Ghi chú:</b> {selectedDetailOrder.note}</div>}
              </div>

              <h4 style={{ margin: "0 0 12px" }}>Danh Sách Mặt Hàng:</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {(Array.isArray(selectedDetailOrder.items) ? selectedDetailOrder.items : []).map((it) => (
                  <div key={it.order_item_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F4F4F5", paddingBottom: 10 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 50, height: 65, background: "#F4F4F5" }}>
                        <img src={it.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200"} alt="item" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{it.product_name}</div>
                        <div style={{ fontSize: 12, color: "#71717A" }}>Màu: {it.color} | Size: {it.size} | SKU: {it.variant_sku}</div>
                        <div style={{ fontSize: 12, color: "#52525B" }}>{formatPrice(it.price)} x {it.quantity}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{formatPrice(it.total_price)}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, textAlign: "right", fontSize: 16, fontWeight: 700 }}>
                Tổng cộng: {formatPrice(selectedDetailOrder.total_amount)}
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Viết Đánh Giá Sản Phẩm (Sau khi DELIVERED) */}
        <Modal
          title={<span style={{ fontFamily: "serif", fontSize: 20 }}>Đánh Giá Sản Phẩm</span>}
          open={isReviewOpen}
          onCancel={() => setIsReviewOpen(false)}
          onOk={handleSubmitReview}
          confirmLoading={submittingReview}
          okText="Gửi Đánh Giá"
          cancelText="Hủy">
          <div style={{ padding: "12px 0" }}>
            <p style={{ fontSize: 13, color: "#71717A" }}>
              Chia sẻ cảm nhận của bạn về chất liệu, độ vừa vặn và phom dáng của sản phẩm để giúp cộng đồng mua sắm tốt hơn.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Chấm điểm số sao:</label>
              <Rate value={rating} onChange={(v) => setRating(v)} style={{ color: "#C5A880", fontSize: 24 }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Nhận xét chi tiết:</label>
              <Input.TextArea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Áo mặc rất tôn dáng, chất len Cashmere mềm mịn, giao hàng đóng gói cẩn thận..."
              />
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
