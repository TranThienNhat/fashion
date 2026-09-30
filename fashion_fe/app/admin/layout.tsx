"use client";

import React, { useEffect, useState } from "react";
import { Layout, Menu, Button, Space, Dropdown } from "antd";
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  TagsOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  StarOutlined,
  FileTextOutlined,
  LogoutOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authUtils } from "@/lib/auth";
import type { User } from "@/lib/types";

const { Header, Sider, Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = authUtils.getUser();
    setUser(currentUser);

    if (!authUtils.isAdmin()) {
      router.push("/login?redirect=/admin");
    }
  }, [router]);

  const menuItems = [
    {
      key: "/admin",
      icon: <DashboardOutlined />,
      label: <Link href="/admin">Tổng Quan (Dashboard)</Link>,
    },
    {
      key: "/admin/products",
      icon: <ShoppingOutlined />,
      label: <Link href="/admin/products">Sản Phẩm & Biến Thể</Link>,
    },
    {
      key: "/admin/categories",
      icon: <AppstoreOutlined />,
      label: <Link href="/admin/categories">Danh Mục Sản Phẩm</Link>,
    },
    {
      key: "/admin/brands",
      icon: <TagsOutlined />,
      label: <Link href="/admin/brands">Thương Hiệu</Link>,
    },
    {
      key: "/admin/inventory",
      icon: <InboxOutlined />,
      label: <Link href="/admin/inventory">Nhập Kho & Nhà Cung Cấp</Link>,
    },
    {
      key: "/admin/orders",
      icon: <ShoppingCartOutlined />,
      label: <Link href="/admin/orders">Quản Lý Đơn Hàng</Link>,
    },
    {
      key: "/admin/users",
      icon: <UserOutlined />,
      label: <Link href="/admin/users">Khách Hàng</Link>,
    },
    {
      key: "/admin/reviews",
      icon: <StarOutlined />,
      label: <Link href="/admin/reviews">Kiểm Duyệt Đánh Giá</Link>,
    },
    {
      key: "/admin/news",
      icon: <FileTextOutlined />,
      label: <Link href="/admin/news">Tạp Chí & Tin Tức</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sider Sidebar */}
      <Sider width={260} theme="dark" style={{ background: "#0D0D0D", borderRight: "1px solid #1F1F1F" }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #1F1F1F" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#FFFFFF", display: "flex", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                ÉLÉGANCE
              </div>
              <div style={{ fontSize: 9, color: "#8F877F", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 2 }}>
                ATELIER • ADMIN
              </div>
            </div>
          </Link>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          style={{ background: "#0D0D0D", marginTop: 12, borderRight: "none" }}
          items={menuItems}
        />
      </Sider>

      {/* Main Content Layout */}
      <Layout>
        <Header
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #EAEAE8",
            padding: "0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 64,
          }}>
          <div style={{ fontSize: 12, color: "#8F877F", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}>
            HỆ THỐNG QUẢN TRỊ ÉLÉGANCE
          </div>

          <Space size={16}>
            <Link href="/">
              <Button
                icon={<HomeOutlined />}
                style={{
                  borderRadius: 0,
                  border: "1px solid #0D0D0D",
                  color: "#0D0D0D",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  height: 36,
                }}>
                Xem Cửa Hàng
              </Button>
            </Link>

            <span style={{ fontSize: 13, fontWeight: 500, color: "#0D0D0D", display: "flex", alignItems: "center", gap: 8 }}>
              {user?.full_name}
              <span
                style={{
                  background: "#0D0D0D",
                  color: "#FFFFFF",
                  fontSize: 10,
                  padding: "2px 8px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}>
                {user?.role}
              </span>
            </span>

            <Button
              icon={<LogoutOutlined />}
              onClick={() => authUtils.logout()}
              style={{
                borderRadius: 0,
                border: "1px solid #EAEAE8",
                color: "#71717A",
                fontSize: 12,
                height: 36,
              }}>
              Đăng Xuất
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: "32px", background: "#FAFAF9", minHeight: "calc(100vh - 64px)" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
