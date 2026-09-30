"use client";

import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Button,
  Radio,
  Spin,
  Alert,
} from "antd";
import {
  DollarOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { reportAPI } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import type { DashboardSummary } from "@/lib/types";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenueTime, setRevenueTime] = useState<any[]>([]);
  const [orderStatusDist, setOrderStatusDist] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [timePeriod, setTimePeriod] = useState<"day" | "month">("day");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [sumRes, revRes, distRes, lowRes] = await Promise.all([
          reportAPI.getDashboardSummary(),
          reportAPI.getRevenueByTime(timePeriod),
          reportAPI.getOrderStatusDistribution(),
          reportAPI.getLowStockWarning(10),
        ]);

        setSummary(sumRes.data?.data || sumRes.data);

        const revData = revRes.data?.data || revRes.data?.items || revRes.data;
        setRevenueTime(Array.isArray(revData) ? revData : []);

        const distData = distRes.data?.data || distRes.data?.items || distRes.data;
        setOrderStatusDist(Array.isArray(distData) ? distData : []);

        const lowData = lowRes.data?.data || lowRes.data?.items || lowRes.data;
        setLowStockItems(Array.isArray(lowData) ? lowData : []);
      } catch (err) {
        console.error("Lỗi tải dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [timePeriod]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Báo Cáo Tổng Quan & Hoạt Động
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Dữ liệu tổng hợp theo thời gian thực được tính toán bằng Native SQL
          </span>
        </div>

        <Link href="/admin/inventory">
          <Button
            type="primary"
            style={{
              background: "#0D0D0D",
              borderColor: "#0D0D0D",
              borderRadius: 0,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              height: 38,
            }}
            icon={<InboxOutlined />}>
            Lập Phiếu Nhập Kho
          </Button>
        </Link>
      </div>

      {/* 1. KPI STATS CARDS */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: "#FFFFFF", borderRadius: 0, border: "1px solid #EAEAE8" }}>
            <Statistic
              title={<span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.08em", color: "#8F877F" }}>Doanh Thu Bán Hàng</span>}
              value={summary?.total_revenue || 0}
              formatter={(val) => formatPrice(Number(val))}
              prefix={<DollarOutlined style={{ color: "#0D0D0D" }} />}
              valueStyle={{ fontWeight: 600, fontSize: 22, color: "#0D0D0D" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: "#FFFFFF", borderRadius: 0, border: "1px solid #EAEAE8" }}>
            <Statistic
              title={<span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.08em", color: "#8F877F" }}>Chi Phí Nhập Kho</span>}
              value={summary?.total_import_cost || 0}
              formatter={(val) => formatPrice(Number(val))}
              prefix={<ShoppingOutlined style={{ color: "#71717A" }} />}
              valueStyle={{ fontWeight: 600, fontSize: 22, color: "#0D0D0D" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: "#FFFFFF", borderRadius: 0, border: "1px solid #EAEAE8" }}>
            <Statistic
              title={<span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.08em", color: "#8F877F" }}>Lợi Nhuận Gộp</span>}
              value={summary?.gross_profit || 0}
              formatter={(val) => formatPrice(Number(val))}
              prefix={<RiseOutlined style={{ color: "#0D0D0D" }} />}
              valueStyle={{ fontWeight: 600, fontSize: 22, color: "#0D0D0D" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ background: "#FFFFFF", borderRadius: 0, border: "1px solid #EAEAE8" }}>
            <Statistic
              title={<span style={{ textTransform: "uppercase", fontSize: 11, letterSpacing: "0.08em", color: "#8F877F" }}>Cảnh Báo Sắp Hết Hàng</span>}
              value={summary?.low_stock_count || 0}
              suffix={<span style={{ fontSize: 13, color: "#71717A" }}>biến thể</span>}
              prefix={<WarningOutlined style={{ color: "#71717A" }} />}
              valueStyle={{ fontWeight: 600, fontSize: 22, color: "#0D0D0D" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 2. REVENUE OVER TIME & STATUS DISTRIBUTION */}
      <Row gutter={[24, 24]} style={{ marginBottom: 28 }}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D0D0D" }}>
                  Doanh Thu Theo Mốc Thời Gian
                </span>
                <Radio.Group
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  size="small">
                  <Radio.Button value="day">Theo Ngày</Radio.Button>
                  <Radio.Button value="month">Theo Tháng</Radio.Button>
                </Radio.Group>
              </div>
            }
            style={{ borderRadius: 0, border: "1px solid #EAEAE8" }}>
            <Table
              dataSource={Array.isArray(revenueTime) ? revenueTime : []}
              rowKey="time_label"
              pagination={{ pageSize: 6 }}
              columns={[
                { title: "Thời gian", dataIndex: "time_label", key: "time_label" },
                { title: "Số đơn hàng", dataIndex: "order_count", key: "order_count" },
                {
                  title: "Doanh số thu về",
                  dataIndex: "revenue",
                  key: "revenue",
                  render: (v) => <b style={{ color: "#0D0D0D" }}>{formatPrice(v)}</b>,
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            title={<span style={{ fontWeight: 600, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D0D0D" }}>Phân Bố Đơn Hàng</span>}
            style={{ borderRadius: 0, border: "1px solid #EAEAE8", height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(Array.isArray(orderStatusDist) ? orderStatusDist : []).map((st) => (
                <div key={st.order_status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F4F4F5", paddingBottom: 8 }}>
                  <div>
                    <Tag style={{ borderRadius: 0, background: "#0D0D0D", color: "#FFFFFF", border: "none", fontSize: 11 }}>{st.order_status}</Tag>
                    <span style={{ fontSize: 12, color: "#8F877F", marginLeft: 6 }}>({st.count} đơn)</span>
                  </div>
                  <b style={{ fontSize: 13, color: "#0D0D0D" }}>{formatPrice(st.total_value)}</b>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 3. LOW STOCK WARNING TABLE */}
      <Card
        bordered={false}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0D0D0D", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            <WarningOutlined /> Cảnh Báo Tồn Kho Dưới Ngưỡng An Toàn (Số lượng ≤ 10)
          </div>
        }
        style={{ borderRadius: 0, border: "1px solid #EAEAE8" }}>
        <Table
          dataSource={Array.isArray(lowStockItems) ? lowStockItems : []}
          rowKey="variant_id"
          pagination={{ pageSize: 6 }}
          columns={[
            {
              title: "Sản phẩm",
              dataIndex: "product_name",
              key: "product_name",
              render: (name, record) => (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img src={record.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100"} alt="thumb" style={{ width: 40, height: 50, objectFit: "cover", border: "1px solid #EAEAE8" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#0D0D0D" }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#8F877F" }}>{record.brand_name} • {record.category_name}</div>
                  </div>
                </div>
              ),
            },
            { title: "SKU", dataIndex: "sku", key: "sku" },
            { title: "Màu sắc", dataIndex: "color", key: "color" },
            { title: "Kích cỡ", dataIndex: "size", key: "size" },
            {
              title: "Số lượng tồn",
              dataIndex: "stock_quantity",
              key: "stock_quantity",
              render: (qty) => (
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    border: qty === 0 ? "1px solid #0D0D0D" : "1px solid #8F877F",
                    background: qty === 0 ? "#0D0D0D" : "transparent",
                    color: qty === 0 ? "#FFFFFF" : "#0D0D0D",
                    fontSize: 11,
                    fontWeight: 600,
                  }}>
                  {qty === 0 ? "HẾT HÀNG (0)" : `Còn ${qty} cái`}
                </span>
              ),
            },
            {
              title: "Hành động",
              key: "action",
              render: () => (
                <Link href="/admin/inventory">
                  <Button size="small" type="primary" style={{ background: "#0D0D0D", borderColor: "#0D0D0D", borderRadius: 0, fontSize: 11, letterSpacing: "0.05em" }}>
                    Nhập Thêm Hàng
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
