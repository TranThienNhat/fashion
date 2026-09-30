"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Row, Col, Typography, Button, Spin, Tag, Rate } from "antd";
import {
  ArrowRightOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { catalogAPI, reviewBlogAPI } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import type { Product, BlogPost } from "@/lib/types";

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [newRes, featRes, blogRes] = await Promise.allSettled([
          catalogAPI.getNewArrivals(8),
          catalogAPI.getFeatured(8),
          reviewBlogAPI.getBlogPosts({ page: 0, size: 3 }),
        ]);

        if (newRes.status === "fulfilled") {
          const resData = newRes.value?.data;
          const items = Array.isArray(resData)
            ? resData
            : (resData?.data || resData?.items || []);
          setNewArrivals(Array.isArray(items) ? items : []);
        }

        if (featRes.status === "fulfilled") {
          const resData = featRes.value?.data;
          const items = Array.isArray(resData)
            ? resData
            : (resData?.data || resData?.items || []);
          setFeaturedProducts(Array.isArray(items) ? items : []);
        }

        if (blogRes.status === "fulfilled") {
          const blogData = blogRes.value?.data;
          const items = Array.isArray(blogData)
            ? blogData
            : (blogData?.content || blogData?.data || blogData?.items || []);
          setRecentBlogs(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        console.error("Lỗi tải trang chủ:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <MainLayout>
      {/* 1. HERO LOOKBOOK BANNER */}
      <section
        style={{
          position: "relative",
          height: "85vh",
          minHeight: 580,
          background: "linear-gradient(rgba(13, 13, 13, 0.4), rgba(13, 13, 13, 0.6)), url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop') center/cover no-repeat",
          display: "flex",
          alignItems: "center",
          color: "#FFFFFF",
        }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 24px", width: "100%" }}>
          <div style={{ maxWidth: 640 }}>
            <span
              style={{
                display: "inline-block",
                padding: "6px 14px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#F9F9F8",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}>
              BỘ SƯU TẬP THU ĐÔNG 2026
            </span>
            <h1
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "clamp(38px, 6vw, 68px)",
                fontWeight: 500,
                lineHeight: 1.1,
                color: "#FFFFFF",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}>
              Chuẩn Mực Của <br />
              <i style={{ fontWeight: 400, color: "#EAEAE8" }}>Quiet Luxury</i>
            </h1>
            <p style={{ fontSize: 15, color: "#E0E0E0", marginTop: 20, lineHeight: 1.7, maxWidth: 520, letterSpacing: "0.02em" }}>
              Tôn vinh sự sang trọng kín đáo qua những đường may đo thủ công tinh xảo, chất liệu Cashmere thượng hạng và lụa tơ tằm nguyên bản.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 36 }}>
              <Link href="/products?sort=newest">
                <Button
                  size="large"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "#FFFFFF",
                    color: "#0D0D0D",
                    borderRadius: 0,
                    fontWeight: 600,
                    height: 48,
                    padding: "0 34px",
                    letterSpacing: "0.12em",
                    fontSize: 12,
                    textTransform: "uppercase",
                  }}>
                  KHÁM PHÁ NGAY
                </Button>
              </Link>
              <Link href="/products">
                <Button
                  size="large"
                  ghost
                  style={{
                    borderRadius: 0,
                    borderColor: "rgba(255, 255, 255, 0.6)",
                    color: "#FFFFFF",
                    height: 48,
                    padding: "0 32px",
                    letterSpacing: "0.12em",
                    fontSize: 12,
                    textTransform: "uppercase",
                  }}>
                  XEM CATALOG
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY HIGHLIGHT GRID */}
      <section style={{ maxWidth: 1360, margin: "72px auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <span style={{ color: "#8F877F", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500 }}>
            DANH MỤC NỔI BẬT
          </span>
          <h2 style={{ fontSize: 34, fontFamily: "Cormorant Garamond, serif", margin: "10px 0 0", color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Dành Riêng Cho Phong Cách Của Bạn
          </h2>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <Link href="/products?category_id=1" style={{ textDecoration: "none" }}>
              <div
                className="fashion-card"
                style={{
                  position: "relative",
                  height: 420,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 28,
                  backgroundImage: "linear-gradient(to top, rgba(13,13,13,0.75) 0%, rgba(13,13,13,0) 65%), url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}>
                <div>
                  <h3 style={{ color: "#FFFFFF", fontSize: 22, margin: 0, fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.04em" }}>
                    Thời Trang Nam
                  </h3>
                  <span style={{ color: "#EAEAE8", fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginTop: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Xem Bộ Sưu Tập <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                </div>
              </div>
            </Link>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Link href="/products?category_id=2" style={{ textDecoration: "none" }}>
              <div
                className="fashion-card"
                style={{
                  position: "relative",
                  height: 420,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 28,
                  backgroundImage: "linear-gradient(to top, rgba(13,13,13,0.75) 0%, rgba(13,13,13,0) 65%), url('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}>
                <div>
                  <h3 style={{ color: "#FFFFFF", fontSize: 22, margin: 0, fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.04em" }}>
                    Thời Trang Nữ
                  </h3>
                  <span style={{ color: "#EAEAE8", fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginTop: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Xem Bộ Sưu Tập <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                </div>
              </div>
            </Link>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Link href="/products?category_id=3" style={{ textDecoration: "none" }}>
              <div
                className="fashion-card"
                style={{
                  position: "relative",
                  height: 420,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 28,
                  backgroundImage: "linear-gradient(to top, rgba(13,13,13,0.75) 0%, rgba(13,13,13,0) 65%), url('https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}>
                <div>
                  <h3 style={{ color: "#FFFFFF", fontSize: 22, margin: 0, fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.04em" }}>
                    Phụ Kiện & Túi Xách Da
                  </h3>
                  <span style={{ color: "#EAEAE8", fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginTop: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Xem Bộ Sưu Tập <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                </div>
              </div>
            </Link>
          </Col>
        </Row>
      </section>

      {/* 3. NEW ARRIVALS SECTION */}
      <section style={{ maxWidth: 1360, margin: "72px auto", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
          <div>
            <span style={{ color: "#8F877F", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500 }}>
              MỚI CẬP NHẬT
            </span>
            <h2 style={{ fontSize: 32, fontFamily: "Cormorant Garamond, serif", margin: "8px 0 0", color: "#0D0D0D", letterSpacing: "0.02em" }}>
              Sản Phẩm Mới Về (New Arrivals)
            </h2>
          </div>
          <Link href="/products?sort=newest" style={{ color: "#0D0D0D", fontWeight: 500, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            XEM TẤT CẢ <ArrowRightOutlined style={{ fontSize: 10 }} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[24, 32]}>
            {(Array.isArray(newArrivals) ? newArrivals : []).filter(Boolean).slice(0, 8).map((prod) => (
              <Col xs={12} sm={8} md={6} key={prod.product_id}>
                <div className="fashion-card" style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
                  <Link href={`/products/${prod.product_id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="fashion-image-container" style={{ aspectRatio: "3/4", background: "#F9F9F8" }}>
                      <img
                        src={prod.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"}
                        alt={prod.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          background: "#0D0D0D",
                          color: "#F9F9F8",
                          fontSize: 9,
                          padding: "3px 7px",
                          letterSpacing: "0.15em",
                          fontWeight: 500,
                          textTransform: "uppercase",
                        }}>
                        MỚI
                      </span>
                    </div>

                    <div style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 500 }}>
                          {prod.brand_name || prod.category_name}
                        </div>
                        <h4
                          style={{
                            margin: "6px 0",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#0D0D0D",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            lineHeight: 1.4,
                          }}>
                          {prod.name}
                        </h4>
                      </div>

                      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0D0D0D", letterSpacing: "0.02em" }}>
                          {formatPrice(prod.base_price)}
                        </span>
                        <span style={{ fontSize: 11, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Chi tiết →
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </section>

      {/* 4. EDITORIAL EDIT / PROMO SECTION */}
      <section
        style={{
          background: "#0D0D0D",
          color: "#F9F9F8",
          padding: "96px 24px",
          margin: "72px 0",
        }}>
        <div style={{ maxWidth: 1360, margin: "0 auto" }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} md={12}>
              <div style={{ aspectRatio: "4/3", position: "relative", overflow: "hidden", border: "1px solid #1F1F1F" }}>
                <img
                  src="https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&auto=format&fit=crop"
                  alt="Editorial Lookbook"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <span style={{ color: "#8F877F", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500 }}>
                TRIẾT LÝ THIẾT KẾ
              </span>
              <h2
                style={{
                  color: "#FFFFFF",
                  fontSize: "clamp(26px, 3.8vw, 40px)",
                  fontFamily: "Cormorant Garamond, serif",
                  margin: "14px 0 22px",
                  lineHeight: 1.25,
                  letterSpacing: "0.02em",
                }}>
                "Thời trang không chỉ là trang phục, mà là tuyên ngôn của phong thái và sự tĩnh lặng."
              </h2>
              <p style={{ color: "#A0A0A0", fontSize: 14, lineHeight: 1.8, maxWidth: 540 }}>
                Mỗi thiết kế tại ÉLÉGANCE đều được chắt lọc từ những xưởng dệt truyền thống châu Âu, qua bàn tay của các nghệ nhân may đo lành nghề. Chúng tôi tôn trọng vẻ đẹp nguyên bản và hướng tới thời trang bền vững vĩnh cửu.
              </p>
              <div style={{ marginTop: 36 }}>
                <Link href="/news">
                  <Button
                    size="large"
                    style={{
                      background: "transparent",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      color: "#FFFFFF",
                      borderRadius: 0,
                      fontWeight: 500,
                      padding: "0 32px",
                      letterSpacing: "0.14em",
                      fontSize: 12,
                      textTransform: "uppercase",
                      height: 46,
                    }}>
                    ĐỌC TẠP CHÍ PHONG CÁCH
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* 5. BEST SELLERS / FEATURED PRODUCTS */}
      <section style={{ maxWidth: 1360, margin: "72px auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <span style={{ color: "#8F877F", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500 }}>
            ĐƯỢC YÊU THÍCH NHẤT
          </span>
          <h2 style={{ fontSize: 32, fontFamily: "Cormorant Garamond, serif", margin: "8px 0 0", color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Sản Phẩm Bán Chạy & Nổi Bật
          </h2>
        </div>

        <Row gutter={[24, 32]}>
          {(Array.isArray(featuredProducts) ? featuredProducts : []).filter(Boolean).slice(0, 8).map((prod) => (
            <Col xs={12} sm={8} md={6} key={prod.product_id}>
              <div className="fashion-card" style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
                <Link href={`/products/${prod.product_id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="fashion-image-container" style={{ aspectRatio: "3/4", background: "#F9F9F8" }}>
                    <img
                      src={prod.thumbnail || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600"}
                      alt={prod.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 500 }}>
                          {prod.brand_name || prod.category_name}
                        </span>
                        {prod.rating && (
                          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#0D0D0D" }}>
                            ★ {prod.rating}
                          </div>
                        )}
                      </div>
                      <h4
                        style={{
                          margin: "6px 0",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#0D0D0D",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.4,
                        }}>
                        {prod.name}
                      </h4>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0D0D0D", letterSpacing: "0.02em" }}>
                        {formatPrice(prod.base_price)}
                      </span>
                      <span style={{ fontSize: 11, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Xem ngay →
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* 6. BLOG / FASHION EDITORIAL */}
      {Array.isArray(recentBlogs) && recentBlogs.length > 0 && (
        <section style={{ maxWidth: 1360, margin: "72px auto", padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
            <div>
              <span style={{ color: "#8F877F", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 500 }}>
                XU HƯỚNG & PHONG CÁCH
              </span>
              <h2 style={{ fontSize: 32, fontFamily: "Cormorant Garamond, serif", margin: "8px 0 0", color: "#0D0D0D", letterSpacing: "0.02em" }}>
                Tạp Chí Thời Trang
              </h2>
            </div>
            <Link href="/news" style={{ color: "#0D0D0D", fontWeight: 500, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              TẤT CẢ BÀI VIẾT <ArrowRightOutlined style={{ fontSize: 10 }} />
            </Link>
          </div>

          <Row gutter={[24, 24]}>
            {(Array.isArray(recentBlogs) ? recentBlogs : []).filter(Boolean).map((b) => (
              <Col xs={24} md={8} key={b.post_id}>
                <Link href={`/news/${b.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="fashion-card" style={{ height: "100%", overflow: "hidden", background: "#FFFFFF" }}>
                    <div style={{ aspectRatio: "16/10", overflow: "hidden" }}>
                      <img
                        src={b.thumbnail || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600"}
                        alt={b.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: 22 }}>
                      <div style={{ fontSize: 10, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 500 }}>
                        BỞI {b.author_name || "ÉLÉGANCE EDITORIAL"}
                      </div>
                      <h3
                        style={{
                          fontSize: 18,
                          fontFamily: "Cormorant Garamond, serif",
                          margin: "8px 0",
                          color: "#0D0D0D",
                          letterSpacing: "0.02em",
                        }}>
                        {b.title}
                      </h3>
                      <p
                        style={{
                          color: "#6B6B6B",
                          fontSize: 13,
                          lineHeight: 1.6,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                        dangerouslySetInnerHTML={{ __html: b.summary || "" }}
                      />
                    </div>
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        </section>
      )}

      {/* 7. TRUST & COMMITMENT BADGES */}
      <section style={{ borderTop: "1px solid #EAEAE8", background: "#FAFAF9", padding: "56px 24px" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto" }}>
          <Row gutter={[32, 32]}>
            <Col xs={12} md={6}>
              <div style={{ textAlign: "center" }}>
                <ThunderboltOutlined style={{ fontSize: 24, color: "#0D0D0D", marginBottom: 14 }} />
                <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D0D0D" }}>
                  Giao Hàng Hỏa Tốc
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#8F877F" }}>Đóng gói sang trọng, nhận hàng trong 24h</p>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ textAlign: "center" }}>
                <SyncOutlined style={{ fontSize: 24, color: "#0D0D0D", marginBottom: 14 }} />
                <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D0D0D" }}>
                  Đổi Trả Trong 30 Ngày
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#8F877F" }}>Đổi size hoặc mẫu mới hoàn toàn miễn phí</p>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ textAlign: "center" }}>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: "#0D0D0D", marginBottom: 14 }} />
                <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D0D0D" }}>
                  Chất Liệu Thượng Hạng
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#8F877F" }}>100% Cashmere, Lụa Ý & Da bê tự nhiên</p>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ textAlign: "center" }}>
                <CustomerServiceOutlined style={{ fontSize: 24, color: "#0D0D0D", marginBottom: 14 }} />
                <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0D0D0D" }}>
                  Stylist Tư Vấn Riêng
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#8F877F" }}>Hỗ trợ phối đồ và may đo theo số đo</p>
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </MainLayout>
  );
}
