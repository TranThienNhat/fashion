"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
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
  Form,
  Select,
} from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  InboxOutlined,
  CloseCircleOutlined,
  StarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { orderAPI, reviewBlogAPI, authAPI, getApiMessage, getApiError } from "@/lib/api";
import { authUtils } from "@/lib/auth";
import { formatPrice, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "@/lib/constants";
import type { Order, UserAddress } from "@/lib/types";

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

  // Address Edit Modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressEditOrder, setAddressEditOrder] = useState<Order | null>(null);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressChoice, setSelectedAddressChoice] = useState<number | "custom">("custom");
  const [addressForm] = Form.useForm();
  const [submittingAddress, setSubmittingAddress] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getMyOrders();
      const oList = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setOrders(Array.isArray(oList) ? oList : []);
    } catch (err: any) {
      message.error(getApiError(err, "Lỗi khi tải lịch sử đơn hàng"));
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
      const res = await orderAPI.cancelOrder(orderId);
      message.success(getApiMessage(res, "Đã hủy đơn hàng thành công và hoàn trả tồn kho"));
      fetchOrders();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể hủy đơn hàng"));
    }
  };

  const handleOpenDetail = async (orderId: number) => {
    try {
      const res = await orderAPI.getOrderDetail(orderId);
      setSelectedDetailOrder(res.data);
      setIsDetailOpen(true);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tải thông tin chi tiết đơn hàng."));
    }
  };

  const handleOpenAddressModal = async (order: Order) => {
    setAddressEditOrder(order);
    setSelectedAddressChoice("custom");
    addressForm.setFieldsValue({
      receiver_name: order.receiver_name || "",
      receiver_phone: order.receiver_phone || "",
      shipping_address: order.shipping_address || "",
    });
    setIsAddressModalOpen(true);

    try {
      const res = await authAPI.getAddresses();
      const aList = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      const addrs: UserAddress[] = Array.isArray(aList) ? aList : [];
      setUserAddresses(addrs);
    } catch (err) {
      console.error("Lỗi tải sổ địa chỉ:", err);
    }
  };

  const handleSelectSavedAddress = (val: number | "custom") => {
    setSelectedAddressChoice(val);
    if (val !== "custom") {
      const addr = userAddresses.find((a) => a.address_id === val);
      if (addr) {
        addressForm.setFieldsValue({
          receiver_name: addr.receiver_name,
          receiver_phone: addr.receiver_phone,
          shipping_address: `${addr.street_detail}, ${addr.ward}, ${addr.district}, ${addr.province}`,
        });
      }
    }
  };

  const handleSaveOrderAddress = async () => {
    if (!addressEditOrder) return;
    try {
      const values = await addressForm.validateFields();
      setSubmittingAddress(true);
      const res = await orderAPI.updateOrderAddress(addressEditOrder.order_id, {
        receiver_name: values.receiver_name.trim(),
        receiver_phone: values.receiver_phone.trim(),
        shipping_address: values.shipping_address.trim(),
      });
      message.success(getApiMessage(res, "Đã cập nhật địa chỉ giao hàng thành công (Đã tính 1 lần đổi duy nhất)!"));
      setIsAddressModalOpen(false);

      // Cập nhật lại danh sách đơn hàng
      await fetchOrders();

      // Nếu đang mở chi tiết của chính đơn đó, cập nhật lại dữ liệu chi tiết
      if (selectedDetailOrder && selectedDetailOrder.order_id === addressEditOrder.order_id) {
        const detailRes = await orderAPI.getOrderDetail(addressEditOrder.order_id);
        setSelectedDetailOrder(detailRes.data);
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(getApiError(err, "Không thể cập nhật địa chỉ giao hàng"));
    } finally {
      setSubmittingAddress(false);
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
    } catch (err: any) {
      message.error(getApiError(err, "Lỗi khi chuẩn bị đánh giá"));
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedProductId) return;
    try {
      setSubmittingReview(true);
      const res = await reviewBlogAPI.submitReview({
        product_id: selectedProductId,
        order_id: reviewOrder?.order_id,
        rating,
        comment,
      });
      message.success(getApiMessage(res, "Cảm ơn bạn đã gửi đánh giá sản phẩm!"));
      setIsReviewOpen(false);
      setComment("");
    } catch (err: any) {
      message.error(getApiError(err, "Lỗi khi gửi đánh giá"));
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
              const addressCount = o.address_changed_count || 0;
              const canChangeAddress = o.order_status === "PENDING" && addressCount < 1;

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

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

                  {/* Địa chỉ giao hàng & Trạng thái đổi địa chỉ */}
                  <div style={{ margin: "8px 0 16px", padding: "12px 16px", background: "#FAF9F6", border: "1px solid #F4F4F5", fontSize: 13, lineHeight: 1.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600, color: "#18181B" }}>Địa chỉ giao hàng: </span>
                        <span style={{ color: "#3F3F46" }}>
                          {o.receiver_name ? `${o.receiver_name} (${o.receiver_phone}) - ` : ""}
                          {o.shipping_address}
                        </span>
                      </div>
                      <div>
                        {o.order_status === "PENDING" && (
                          canChangeAddress ? (
                            <Button
                              size="small"
                              type="link"
                              onClick={() => handleOpenAddressModal(o)}
                              icon={<EditOutlined />}
                              style={{ padding: 0, height: "auto", color: "#B45309", fontWeight: 600 }}>
                              Đổi địa chỉ (Còn 1 lần)
                            </Button>
                          ) : (
                            <Tag color="orange" style={{ margin: 0, fontSize: 11, borderRadius: 0 }}>
                              Đã đổi địa chỉ (1/1 lần)
                            </Tag>
                          )
                        )}
                        {o.order_status !== "PENDING" && addressCount >= 1 && (
                          <Tag style={{ margin: 0, fontSize: 11, borderRadius: 0, color: "#71717A" }}>
                            Đã đổi địa chỉ (1/1)
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer thông tin và thao tác */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #F4F4F5", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 13, color: "#71717A" }}>Tổng tiền thanh toán: </span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#18181B" }}>
                        {formatPrice(o.total_amount)}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <Button onClick={() => handleOpenDetail(o.order_id)} style={{ borderRadius: 0 }}>
                        Chi Tiết Đơn Hàng
                      </Button>

                      {canChangeAddress && (
                        <Button
                          onClick={() => handleOpenAddressModal(o)}
                          style={{ borderRadius: 0, borderColor: "#D97706", color: "#B45309" }}
                          icon={<EditOutlined />}>
                          Đổi Địa Chỉ
                        </Button>
                      )}

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div><b>Người nhận:</b> {selectedDetailOrder.receiver_name} ({selectedDetailOrder.receiver_phone})</div>
                  {selectedDetailOrder.order_status === "PENDING" && (
                    (selectedDetailOrder.address_changed_count || 0) < 1 ? (
                      <Button
                        size="small"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenAddressModal(selectedDetailOrder)}
                        style={{ background: "#18181B", borderRadius: 0, fontSize: 12 }}>
                        Đổi Địa Chỉ (1 lần duy nhất)
                      </Button>
                    ) : (
                      <Tag color="orange" style={{ borderRadius: 0 }}>Đã đổi địa chỉ (1/1 lần)</Tag>
                    )
                  )}
                </div>
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

        {/* Modal Thay Đổi Địa Chỉ Nhận Hàng (Chỉ 1 lần khi PENDING) */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <EnvironmentOutlined style={{ color: "#C5A880", fontSize: 20 }} />
              <span style={{ fontFamily: "serif", fontSize: 20 }}>
                Đổi Địa Chỉ Nhận Hàng - Đơn #{addressEditOrder?.order_code}
              </span>
            </div>
          }
          open={isAddressModalOpen}
          onCancel={() => setIsAddressModalOpen(false)}
          footer={null}
          width={620}
          destroyOnClose>
          <div style={{ padding: "8px 0" }}>
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                padding: "12px 16px",
                borderRadius: 4,
                marginBottom: 20,
                fontSize: 13,
                color: "#92400E",
                lineHeight: 1.5,
              }}>
              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <ExclamationCircleOutlined /> QUY ĐỊNH THAY ĐỔI ĐỊA CHỈ NHẬN HÀNG:
              </div>
              <div style={{ marginTop: 6 }}>
                Quý khách chỉ được phép thay đổi địa chỉ <strong>1 LẦN DUY NHẤT</strong> khi đơn hàng đang ở trạng thái <strong>Chờ xử lý</strong>. Sau khi xác nhận thay đổi thành công, địa chỉ sẽ được khóa vĩnh viễn để bàn giao cho đối tác vận chuyển.
              </div>
            </div>

            {userAddresses.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                  Chọn nhanh từ Sổ địa chỉ của bạn:
                </label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn địa chỉ đã lưu trong sổ địa chỉ"
                  value={selectedAddressChoice}
                  onChange={handleSelectSavedAddress}
                  options={[
                    { value: "custom", label: "✍️ Tự nhập / Điều chỉnh địa chỉ bên dưới" },
                    ...userAddresses.map((a) => ({
                      value: a.address_id,
                      label: `📍 ${a.receiver_name} (${a.receiver_phone}) - ${a.street_detail}, ${a.ward}, ${a.district}, ${a.province}${a.is_default ? " [Mặc định]" : ""}`,
                    })),
                  ]}
                />
              </div>
            )}

            <Form form={addressForm} layout="vertical">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Form.Item
                  label="Tên Người Nhận"
                  name="receiver_name"
                  rules={[{ required: true, message: "Vui lòng nhập tên người nhận" }]}>
                  <Input placeholder="Nguyễn Văn A" style={{ borderRadius: 0 }} />
                </Form.Item>

                <Form.Item
                  label="Số Điện Thoại"
                  name="receiver_phone"
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                    { pattern: /^[0-9]{9,11}$/, message: "Số điện thoại không hợp lệ" },
                  ]}>
                  <Input placeholder="0901234567" style={{ borderRadius: 0 }} />
                </Form.Item>
              </div>

              <Form.Item
                label="Địa Chỉ Chi Tiết (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành)"
                name="shipping_address"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ nhận hàng" }]}>
                <Input.TextArea
                  rows={3}
                  placeholder="Số 123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                  style={{ borderRadius: 0 }}
                />
              </Form.Item>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #F4F4F5" }}>
                <Button onClick={() => setIsAddressModalOpen(false)} style={{ borderRadius: 0 }}>
                  Hủy Bỏ
                </Button>
                <Popconfirm
                  title="Xác nhận đổi địa chỉ nhận hàng?"
                  description="Bạn chỉ được đổi 1 lần duy nhất cho đơn hàng này. Sau khi lưu sẽ không thể sửa lại nữa!"
                  onConfirm={handleSaveOrderAddress}
                  okText="Xác Nhận Đổi"
                  cancelText="Xem Lại">
                  <Button
                    type="primary"
                    loading={submittingAddress}
                    style={{ borderRadius: 0, background: "#18181B", borderColor: "#18181B" }}>
                    Lưu Địa Chỉ Mới
                  </Button>
                </Popconfirm>
              </div>
            </Form>
          </div>
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
