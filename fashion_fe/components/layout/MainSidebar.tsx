"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  HomeOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  FireOutlined,
  ThunderboltOutlined,
  StarOutlined,
  TagOutlined,
} from "@ant-design/icons";

interface MainSidebarProps {
  collapsed: boolean;
}

export default function MainSidebar({ collapsed }: MainSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: "home",
      label: "Trang chủ",
      icon: <HomeOutlined />,
      path: "/",
    },
    {
      key: "products",
      label: "Sản phẩm",
      icon: <AppstoreOutlined />,
      path: "/products",
    },
    {
      key: "news",
      label: "Tin tức",
      icon: <FileTextOutlined />,
      path: "/news",
    },
  ];

  const exploreItems = [
    {
      key: "hot",
      label: "Sản phẩm hot",
      icon: <FireOutlined />,
      path: "/products?filter=hot",
      color: "#FF0000",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 56,
        bottom: 0,
        width: collapsed ? 72 : 240,
        background: "#fff",
        borderRight: "1px solid #e5e5e5",
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 999,
        scrollbarWidth: "thin",
        scrollbarColor: "#909090 transparent",
      }}>
      {/* Main Menu */}
      <div style={{ padding: collapsed ? "12px 0" : "12px 0" }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <div
              key={item.key}
              onClick={() => router.push(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: collapsed ? "0 24px" : "0 24px",
                height: 40,
                cursor: "pointer",
                background: active ? "#f2f2f2" : "transparent",
                borderLeft: active
                  ? "3px solid #FF0000"
                  : "3px solid transparent",
                transition: "all 0.15s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "#f9f9f9";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}>
              <span
                style={{
                  fontSize: 24,
                  color: active ? "#030303" : "#606060",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  width: collapsed ? "100%" : "auto",
                  transition: "color 0.15s ease",
                }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#030303" : "#606060",
                    whiteSpace: "nowrap",
                    transition: "color 0.15s ease",
                  }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "#e5e5e5",
          margin: "12px 0",
        }}
      />

      {/* Explore Section */}
      {!collapsed && (
        <div style={{ padding: "8px 24px" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#606060",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}>
            Khám phá
          </div>
        </div>
      )}

      <div style={{ padding: collapsed ? "12px 0" : "0 0 12px 0" }}>
        {exploreItems.map((item) => {
          const active = pathname.includes(item.path);
          return (
            <div
              key={item.key}
              onClick={() => router.push(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: collapsed ? "0 24px" : "0 24px",
                height: 40,
                cursor: "pointer",
                background: active ? "#f2f2f2" : "transparent",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "#f9f9f9";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}>
              <span
                style={{
                  fontSize: 24,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  width: collapsed ? "100%" : "auto",
                }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#030303" : "#606060",
                    whiteSpace: "nowrap",
                  }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
