"use client";

import { Layout, Menu } from "antd";
import { useRouter, usePathname } from "next/navigation";

const { Sider } = Layout;

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface SidebarProps {
  collapsed: boolean;
  items: MenuItem[];
  theme?: "light" | "dark";
  width?: number;
  collapsedWidth?: number;
  logo?: React.ReactNode;
  className?: string;
  top?: number;
  zIndex?: number;
  selectedKey?: string;
}

export default function Sidebar({
  collapsed,
  items,
  theme = "light",
  width = 240,
  collapsedWidth = 72,
  logo,
  className = "",
  top = 0,
  zIndex = 1000,
  selectedKey,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine selected key based on pathname if not provided
  const getSelectedKey = () => {
    if (selectedKey) return selectedKey;
    if (pathname === "/") return "home";
    if (pathname.startsWith("/products")) return "products";
    if (pathname.startsWith("/news")) return "news";
    return "";
  };

  const menuItems = items.map((item) => ({
    ...item,
    onClick: item.onClick || (() => router.push(item.key)),
  }));

  return (
    <Sider
      collapsed={collapsed}
      trigger={null}
      width={width}
      collapsedWidth={collapsedWidth}
      className={`custom-sidebar ${
        theme === "dark" ? "dark-theme" : "light-theme"
      } ${className}`}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top,
        zIndex,
        background: theme === "dark" ? "#000" : "#fff",
        borderRight: theme === "dark" ? "none" : "1px solid #e5e5e5",
        boxShadow: theme === "dark" ? "2px 0 8px rgba(0,0,0,0.15)" : "none",
      }}>
      {/* Logo Area */}
      {logo && (
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            borderBottom:
              theme === "dark" ? "1px solid #1a1a1a" : "1px solid #e5e5e5",
          }}>
          {logo}
        </div>
      )}

      {/* Menu */}
      <Menu
        theme={theme}
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{
          background: theme === "dark" ? "#1a1f2e" : "#fff",
          border: "none",
          marginTop: logo ? 16 : 12,
        }}
      />
    </Sider>
  );
}
