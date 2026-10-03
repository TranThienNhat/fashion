"use client";

import { Button, Typography, Space, Dropdown, Badge } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  MenuOutlined,
  SearchOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authUtils } from "@/lib/auth";

const { Title } = Typography;

interface MainHeaderProps {
  onMenuClick: () => void;
}

export default function MainHeader({ onMenuClick }: MainHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(authUtils.getUser());
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #e5e5e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
      }}>
      {/* Left: Menu + Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flex: "0 0 auto",
        }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onMenuClick}
          className="youtube-icon-btn"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: "#030303",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f2f2")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        />
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 8,
            transition: "background 0.15s ease",
          }}
          onClick={() => router.push("/")}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }>

          <Title
            level={4}
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 20,
              color: "#030303",
              letterSpacing: "-0.8px",
            }}>
            VINH STORE
          </Title>
        </div>
      </div>
      {/* Right: Actions */}
      <Space size={8} style={{ flex: "0 0 auto" }}>
        {user ? (
          <>
            <Badge size="small" offset={[-4, 4]}>
              <Button
                type="text"
                icon={<ShoppingCartOutlined />}
                onClick={() => router.push("/cart")}
                className="youtube-icon-btn"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "#030303",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f2f2f2")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              />
            </Badge>
            {authUtils.isAdmin() && (
              <Button
                onClick={() => router.push("/admin")}
                style={{
                  height: 36,
                  borderRadius: 18,
                  border: "1px solid #065fd4",
                  color: "#065fd4",
                  fontWeight: 500,
                  padding: "0 16px",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#def1ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}>
                Admin Panel
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
              placement="bottomRight"
              trigger={["click"]}>
              <Button
                type="text"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  border: "2px solid #fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }>
                {(((user as any)?.full_name || (user as any)?.ho_ten || (user as any)?.ten_dang_nhap || "U") as string)
                  .charAt(0)
                  .toUpperCase()}
              </Button>
            </Dropdown>
          </>
        ) : (
          <>
            <Button
              onClick={() => router.push("/login")}
              style={{
                height: 36,
                borderRadius: 18,
                border: "1px solid #065fd4",
                color: "#065fd4",
                fontWeight: 500,
                padding: "0 16px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#def1ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}>
              <UserOutlined /> Đăng nhập
            </Button>
            <Button
              type="primary"
              onClick={() => router.push("/register")}
              style={{
                height: 36,
                borderRadius: 18,
                background: "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)",
                borderColor: "transparent",
                fontWeight: 500,
                padding: "0 16px",
                boxShadow: "0 1px 2px rgba(255,0,0,0.3)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(255,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 2px rgba(255,0,0,0.3)";
              }}>
              Đăng ký
            </Button>
          </>
        )}
      </Space>
    </header>
  );
}
