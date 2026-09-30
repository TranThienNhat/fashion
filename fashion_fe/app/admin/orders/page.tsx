"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Select,
  Tag,
  Modal,
  Space,
  Input,
  message,
  Popconfirm,
  Badge,
} from "antd";
import { SearchOutlined, EyeOutlined, SyncOutlined } from "@ant-design/icons";
import { orderAPI } from "@/lib/api";
import { formatPrice, ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "@/lib/constants";
import type { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.adminGetOrders({
        page: page - 1,
        size: 10,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setOrders(res.data.content || []);
      setTotal(res.data.total || 0);
    } catch {
      message.error("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, search]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderAPI.adminUpdateStatus(orderId, newStatus);
      message.success(`Đã cập nhật trạng thái đơn hàng sang ${newStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.order_id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus });
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Lỗi cập nhật trạng thái");
    }
  };

  const handleUpdatePayment = async (orderId: number, newPayStatus: string) => {
    try {
      await orderAPI.adminUpdatePayment(orderId, newPayStatus);
      message.success(`Đã cập nhật thanh toán sang ${newPayStatus}`);
      fetchOrders();
      if (selectedOrder && selectedOrder.order_id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newPayStatus });
      }
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Lỗi cập nhật thanh toán");
    }
  };

  const handleOpenDetail = async (orderId: number) => {
    try {
      const res = await orderAPI.getOrderDetail(orderId);
      setSelectedOrder(res.data);
      setIsDetailOpen(true);
    } catch {
      message.error("Lỗi lấy chi tiết đơn hàng");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Đơn Hàng & Vòng Đời Xử Lý
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Theo dõi, cập nhật tiến độ đơn hàng và cơ chế tự động hoàn tồn khi hủy đơn
          </span>
        </div>

        <Space>
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            value={statusFilter || undefined}
            onChange={(val) => { setStatusFilter(val); setPage(1); }}
            style={{ width: 180 }}
            options={[
              { value: "PENDING", label: "Chờ xử lý" },
              { value: "CONFIRMED", label: "Đã xác nhận" },
              { value: "SHIPPING", label: "Đang giao hàng" },
              { value: "DELIVERED", label: "Giao thành công" },
              { value: "CANCELLED", label: "Đã hủy đơn" },
            ]}
          />
          <Input
            placeholder="Tìm mã đơn, tên, sđt..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 220 }}
          />
        </Space>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: 20 }}>
        <Table
          dataSource={orders}
          rowKey="order_id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: (p) => setPage(p),
          }}
          columns={[
            {
              title: "Mã đơn hàng",
              dataIndex: "order_code",
              key: "order_code",
              render: (code, record) => (
                <div>
                  <b style={{ color: "#18181B" }}>{code}</b>
                  <div style={{ fontSize: 11, color: "#71717A" }}>
                    {new Date(record.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>
              ),
            },
            {
              title: "Khách hàng",
              key: "customer",
              render: (_, record) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{record.receiver_name}</div>
                  <div style={{ fontSize: 12, color: "#71717A" }}>{record.receiver_phone}</div>
                </div>
              ),
            },
            {
              title: "Tổng tiền",
              dataIndex: "total_amount",
              key: "total_amount",
              render: (v) => <b style={{ color: "#18181B" }}>{formatPrice(v)}</b>,
            },
            {
              title: "Thanh toán",
              key: "payment",
              render: (_, record) => {
                const payCfg = PAYMENT_STATUS_MAP[record.payment_status] || { label: record.payment_status, color: "#71717A", bg: "#F4F4F5" };
                return (
                  <div>
                    <Tag style={{ borderRadius: 0, color: payCfg.color, background: payCfg.bg, borderColor: "transparent" }}>
                      {payCfg.label}
                    </Tag>
                    <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>{record.payment_method}</div>
                  </div>
                );
              },
            },
            {
              title: "Trạng thái đơn hàng",
              key: "order_status",
              render: (_, record) => {
                const statusCfg = ORDER_STATUS_MAP[record.order_status] || { label: record.order_status, color: "#71717A", bg: "#F4F4F5" };
                return (
                  <Tag style={{ borderRadius: 0, color: statusCfg.color, background: statusCfg.bg, borderColor: "transparent", fontWeight: 600 }}>
                    {statusCfg.label}
                  </Tag>
                );
              },
            },
            {
              title: "Cập nhật nhanh",
              key: "quick_action",
              render: (_, record) => (
                <Select
                  size="small"
                  value={record.order_status}
                  onChange={(newSt) => handleUpdateStatus(record.order_id, newSt)}
                  style={{ width: 140 }}>
                  <Select.Option value="PENDING">Chờ xử lý</Select.Option>
                  <Select.Option value="CONFIRMED">Đã xác nhận</Select.Option>
                  <Select.Option value="SHIPPING">Đang giao</Select.Option>
                  <Select.Option value="DELIVERED">Đã giao</Select.Option>
                  <Select.Option value="CANCELLED">Hủy đơn</Select.Option>
                </Select>
              ),
            },
            {
              title: "Thao tác",
              key: "action",
              render: (_, record) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record.order_id)}>
                  Chi Tiết
                </Button>
              ),
            },
          ]}
        />
      </div>

      {/* Modal Chi Tiết Đơn Hàng Admin */}
      <Modal
        title={<span style={{ fontFamily: "serif", fontSize: 20 }}>Chi Tiết Đơn Hàng #{selectedOrder?.order_code}</span>}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={null}
        width={750}>
        {selectedOrder && (
          <div style={{ padding: "12px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#FAFAF9", border: "1px solid #EAEAE8", padding: 16, marginBottom: 20, fontSize: 13, lineHeight: 1.8 }}>
              <div>
                <div><b>Người nhận:</b> {selectedOrder.receiver_name}</div>
                <div><b>Số điện thoại:</b> {selectedOrder.receiver_phone}</div>
                <div><b>Địa chỉ:</b> {selectedOrder.shipping_address}</div>
                <div><b>Ghi chú:</b> {selectedOrder.note || "Không có"}</div>
              </div>
              <div>
                <div><b>Phương thức thanh toán:</b> {selectedOrder.payment_method}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <b>Trạng thái thanh toán:</b>
                  <Select
                    size="small"
                    value={selectedOrder.payment_status}
                    onChange={(val) => handleUpdatePayment(selectedOrder.order_id, val)}
                    style={{ width: 140 }}>
                    <Select.Option value="UNPAID">Chưa thanh toán</Select.Option>
                    <Select.Option value="PAID">Đã thanh toán</Select.Option>
                    <Select.Option value="REFUNDED">Đã hoàn tiền</Select.Option>
                  </Select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <b>Trạng thái đơn hàng:</b>
                  <Select
                    size="small"
                    value={selectedOrder.order_status}
                    onChange={(val) => handleUpdateStatus(selectedOrder.order_id, val)}
                    style={{ width: 140 }}>
                    <Select.Option value="PENDING">Chờ xử lý</Select.Option>
                    <Select.Option value="CONFIRMED">Đã xác nhận</Select.Option>
                    <Select.Option value="SHIPPING">Đang giao</Select.Option>
                    <Select.Option value="DELIVERED">Đã giao</Select.Option>
                    <Select.Option value="CANCELLED">Hủy đơn (Hoàn tồn)</Select.Option>
                  </Select>
                </div>
              </div>
            </div>

            <h4 style={{ margin: "0 0 12px" }}>Danh Sách Sản Phẩm Đặt Mua:</h4>
            <Table
              dataSource={selectedOrder.items}
              rowKey="order_item_id"
              pagination={false}
              columns={[
                {
                  title: "Sản phẩm",
                  dataIndex: "product_name",
                  key: "product_name",
                  render: (name: any, r: any) => (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <img src={r?.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100"} alt="thumb" style={{ width: 36, height: 46, objectFit: "cover" }} />
                      <div>
                        <b>{name}</b>
                        <div style={{ fontSize: 11, color: "#71717A" }}>SKU: {r?.variant_sku || "N/A"}</div>
                      </div>
                    </div>
                  ),
                },
                { title: "Màu / Size", key: "color_size", render: (_: any, r: any) => `${r?.color || ""} / ${r?.size || ""}` },
                { title: "Đơn giá", dataIndex: "price", key: "price", render: (v: any) => formatPrice(v) },
                { title: "Số lượng", dataIndex: "quantity", key: "quantity", render: (q: any) => `x${q}` },
                { title: "Thành tiền", dataIndex: "total_price", key: "total_price", render: (v: any) => <b>{formatPrice(v)}</b> },
              ]}
            />

            <div style={{ marginTop: 20, textAlign: "right", fontSize: 18, fontWeight: 700 }}>
              Tổng tiền: {formatPrice(selectedOrder.total_amount)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
