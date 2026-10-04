"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Dropdown, Input, Button, MenuProps } from "antd";
import {
  ShoppingOutlined,
  UserOutlined,
  SearchOutlined,
  DashboardOutlined,
  LogoutOutlined,
  UnorderedListOutlined,
  IdcardOutlined,
  DownOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { useCart } from "@/contexts/CartContext";
import { catalogAPI } from "@/lib/api";
import { authUtils } from "@/lib/auth";
import type { User, Category } from "@/lib/types";

const DEFAULT_CATEGORIES: Category[] = [
  { category_id: 1, name: "NAM", slug: "thoi-trang-nam", is_active: true },
  { category_id: 2, name: "NỮ", slug: "thoi-trang-nu", is_active: true },
  { category_id: 3, name: "PHỤ KIỆN", slug: "phu-kien-cao-cap", is_active: true },
];

export default function MainHeader() {
  const router = useRouter();
  const { cartCount, setIsDrawerOpen } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setUser(authUtils.getUser());
    async function loadCategories() {
      try {
        const res = await catalogAPI.getCategories();
        const tree = res.data?.tree || res.data?.data?.tree || res.data?.flat || res.data?.data?.flat || [];
        setCategories(Array.isArray(tree) ? tree : []);
      } catch (err) {
        console.error("Lỗi tải danh mục header:", err);
      }
    }
    loadCategories();
  }, []);

  // Lấy các danh mục gốc đang hoạt động (parent_id IS NULL)
  const rootCategories = useMemo(() => {
    if (!categories || categories.length === 0) return DEFAULT_CATEGORIES;
    const roots = categories.filter((c) => !c.parent_id && c.is_active !== false);
    return roots.length > 0 ? roots : DEFAULT_CATEGORIES;
  }, [categories]);

  // 3 danh mục đầu tiên hiển thị trực tiếp
  const visibleCategories = useMemo(() => rootCategories.slice(0, 3), [rootCategories]);
  // Danh mục thứ 4 trở đi đưa vào menu "..."
  const moreCategories = useMemo(() => rootCategories.slice(3), [rootCategories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchKeyword.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = () => {
    authUtils.logout();
    setUser(null);
  };

  const userMenuItems: MenuProps["items"] = user
    ? [
        {
          key: "user-info",
          label: (
            <div style={{ padding: "4px 8px" }}>
              <div style={{ fontWeight: 600 }}>{user.full_name || user.email || "Tài khoản"}</div>
              <div style={{ fontSize: 12, color: "#71717A" }}>{user.email}</div>
            </div>
          ),
          disabled: true,
        },
        { type: "divider" },
        {
          key: "profile",
          icon: <IdcardOutlined />,
          label: <Link href="/profile">Hồ Sơ & Sổ Địa Chỉ</Link>,
        },
        {
          key: "orders",
          icon: <UnorderedListOutlined />,
          label: <Link href="/orders">Đơn Mua Của Tôi</Link>,
        },
        ...(user.role === "ADMIN" || user.role === "STAFF"
          ? [
              {
                key: "admin",
                icon: <DashboardOutlined />,
                label: <Link href="/admin">Trang Quản Trị (Admin)</Link>,
              },
            ]
          : []),
        { type: "divider" },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          danger: true,
          label: <span onClick={handleLogout}>Đăng Xuất</span>,
        },
      ]
    : [
        {
          key: "login",
          label: <Link href="/login">Đăng Nhập</Link>,
        },
        {
          key: "register",
          label: <Link href="/register">Đăng Ký Tài Khoản</Link>,
        },
      ];

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 1000, background: "#FFFFFF", borderBottom: "1px solid #EAEAE8", width: "100%" }}>
      {/* Top Banner Thông Báo */}
      <div
        style={{
          background: "#0D0D0D",
          color: "#E5E5E5",
          textAlign: "center",
          fontSize: "11px",
          letterSpacing: "0.15em",
          padding: "8px 16px",
          fontWeight: 400,
          textTransform: "uppercase",
        }}>
        <span>MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC CHO ĐƠN HÀNG TỪ 1.500.000Đ — ĐỔI TRẢ TRONG 30 NGÀY</span>
      </div>

      {/* Main Navbar */}
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "0 28px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1001,
        }}>
        {/* Brand Logo */}
        <Link href="/" style={{ textDecoration: "none", color: "#0D0D0D", display: "flex", alignItems: "center", cursor: "pointer" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1.1 }}>
              VINH STORE
            </span>
            <span style={{ fontSize: 9, letterSpacing: "0.3em", color: "#8F877F", textTransform: "uppercase" }}>
              THỜI TRANG CAO CẤP
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#0D0D0D", fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", cursor: "pointer" }}>
            TRANG CHỦ
          </Link>
          <Link href="/products?sort=newest" style={{ textDecoration: "none", color: "#0D0D0D", fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", cursor: "pointer" }}>
            HÀNG MỚI VỀ
          </Link>

          {/* Dynamic 3 danh mục đầu tiên */}
          {visibleCategories.map((cat) => {
            const hasSub = cat.children && cat.children.length > 0;
            if (!hasSub) {
              return (
                <Link
                  key={cat.category_id}
                  href={`/products?category_id=${cat.category_id}`}
                  style={{
                    textDecoration: "none",
                    color: "#0D0D0D",
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                  }}>
                  {(cat.name || "").toUpperCase()}
                </Link>
              );
            }

            const subMenuItems: MenuProps["items"] = (cat.children || []).map((sub: Category) => ({
              key: `sub-${sub.category_id}`,
              label: (
                <Link href={`/products?category_id=${sub.category_id}`} style={{ fontSize: 13, padding: "2px 4px" }}>
                  {sub.name}
                </Link>
              ),
            }));

            return (
              <Dropdown key={cat.category_id} menu={{ items: subMenuItems }} placement="bottomCenter">
                <Link
                  href={`/products?category_id=${cat.category_id}`}
                  style={{
                    textDecoration: "none",
                    color: "#0D0D0D",
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}>
                  {(cat.name || "").toUpperCase()}
                  <DownOutlined style={{ fontSize: 9, color: "#8F877F" }} />
                </Link>
              </Dropdown>
            );
          })}

          {/* Từ danh mục thứ 4 trở đi: Menu "..." để xem thêm danh mục */}
          {moreCategories.length > 0 && (
            <Dropdown
              menu={{
                items: moreCategories.map((cat) => {
                  const hasSub = Array.isArray(cat.children) && cat.children.length > 0;
                  return {
                    key: `more-cat-${cat.category_id}`,
                    label: (
                      <Link
                        href={`/products?category_id=${cat.category_id}`}
                        style={{ fontWeight: 600, fontSize: 13, display: "block" }}>
                        {(cat.name || "").toUpperCase()}
                      </Link>
                    ),
                    children: hasSub
                      ? (cat.children || []).map((sub: Category) => ({
                          key: `more-sub-${sub.category_id}`,
                          label: (
                            <Link href={`/products?category_id=${sub.category_id}`} style={{ fontSize: 13 }}>
                              {sub.name}
                            </Link>
                          ),
                        }))
                      : undefined,
                  };
                }),
              }}
              placement="bottomCenter">
              <span
                style={{
                  cursor: "pointer",
                  color: "#0D0D0D",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: 4,
                  lineHeight: 1,
                }}
                title="Xem thêm các danh mục khác">
                ...
                <DownOutlined style={{ fontSize: 9, color: "#8F877F" }} />
              </span>
            </Dropdown>
          )}

          <Link href="/news" style={{ textDecoration: "none", color: "#0D0D0D", fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", cursor: "pointer" }}>
            TẠP CHÍ
          </Link>
        </nav>

        {/* Right Action Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Search Trigger */}
          <div style={{ position: "relative" }}>
            {isSearchOpen ? (
              <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center" }}>
                <Input
                  autoFocus
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onBlur={() => !searchKeyword && setIsSearchOpen(false)}
                  style={{ width: 220, borderRadius: 0, borderColor: "#0D0D0D", fontSize: 13 }}
                  suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: "pointer", color: "#0D0D0D" }} />}
                />
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "#0D0D0D", padding: 4 }}>
                <SearchOutlined />
              </button>
            )}
          </div>

          {/* User Account Menu */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow trigger={["hover", "click"]}>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#0D0D0D",
                padding: 4,
              }}>
              <UserOutlined style={{ fontSize: 17 }} />
              {user && <span style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em" }}>{(user.full_name || user.email || "User").split(" ").slice(-1)[0]}</span>}
            </button>
          </Dropdown>

          {/* Cart Drawer Trigger */}
          <Badge count={cartCount} offset={[-2, 2]} color="#0D0D0D">
            <button
              onClick={() => setIsDrawerOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: "#0D0D0D",
                padding: 4,
              }}>
              <ShoppingOutlined />
            </button>
          </Badge>
        </div>
      </div>
    </header>
  );
}
