"use client";

import { Layout, Button, Space, Dropdown } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  HomeOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { authUtils } from "@/lib/auth";
import { useState, useEffect } from "react";

const { Header: AntHeader } = Layout;

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(authUtils.getUser());
  }, []);

  return (
    <AntHeader
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: "0 50px",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h3
              style={{
                color: "white",
                margin: 0,
                fontWeight: "bold",
                fontSize: 22,
                letterSpacing: "0.15em",
                fontFamily: "Cormorant Garamond, serif",
              }}>
              ÉLÉGANCE
            </h3>
          </div>
        </div>
        <Space size="large">
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => router.push("/")}
            style={{ color: "white" }}>
            Trang chủ
          </Button>
          <Button
            type="text"
            icon={<AppstoreOutlined />}
            onClick={() => router.push("/products")}
            style={{ color: "white" }}>
            Sản phẩm
          </Button>
          <Button
            type="text"
            icon={<FileTextOutlined />}
            onClick={() => router.push("/news")}
            style={{ color: "white" }}>
            Tin tức
          </Button>
        </Space>
      </div>
      <Space>
        {user ? (
          <>
            <Button
              icon={<ShoppingCartOutlined />}
              onClick={() => router.push("/cart")}
              style={{ borderRadius: 20 }}>
              Giỏ hàng
            </Button>
            {authUtils.isAdmin() && (
              <Button
                onClick={() => router.push("/admin")}
                style={{ borderRadius: 20 }}>
                Quản trị
              </Button>
            )}
            <Dropdown
              menu={{
                items: [
                  {
                    key: "profile",
                    icon: <UserOutlined />,
                    label: "Thông tin tài khoản",
                    onClick: () => router.push("/profile"),
                  },
                  {
                    key: "orders",
                    icon: <ShoppingOutlined />,
                    label: "Đơn hàng của tôi",
                    onClick: () => router.push("/orders"),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: "Đăng xuất",
                    danger: true,
                    onClick: () => authUtils.logout(),
                  },
                ],
              }}
              placement="bottomRight">
              <Button
                type="primary"
                style={{
                  borderRadius: 20,
                  background: "#52c41a",
                  borderColor: "#52c41a",
                }}>
                <UserOutlined />
                {(user as any)?.full_name || (user as any)?.ho_ten || (user as any)?.ten_dang_nhap || "Tài khoản"}
                <DownOutlined />
              </Button>
            </Dropdown>
          </>
        ) : (
          <>
            <Button
              onClick={() => router.push("/login")}
              style={{ borderRadius: 20 }}>
              Đăng nhập
            </Button>
            <Button
              type="primary"
              onClick={() => router.push("/register")}
              style={{
                borderRadius: 20,
                background: "#52c41a",
                borderColor: "#52c41a",
              }}>
              Đăng ký
            </Button>
          </>
        )}
      </Space>
    </AntHeader>
  );
}
