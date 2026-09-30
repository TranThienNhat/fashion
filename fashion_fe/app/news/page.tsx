"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Row, Col, Spin, Empty, Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { reviewBlogAPI } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

export default function NewsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true);
        const res = await reviewBlogAPI.getBlogPosts({ page: 0, size: 12 });
        const data = res.data?.content || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setPosts(Array.isArray(data) ? data : []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  return (
    <MainLayout>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 48px" }}>
          <span style={{ color: "#C5A880", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            ÉLÉGANCE EDITORIAL
          </span>
          <h1 style={{ fontSize: 44, fontFamily: "Cormorant Garamond, serif", margin: "12px 0", color: "#18181B" }}>
            Tạp Chí Phong Cách & Xu Hướng
          </h1>
          <p style={{ color: "#71717A", fontSize: 15, lineHeight: 1.6 }}>
            Nơi chia sẻ những bí quyết phối đồ độc bản, câu chuyện hậu trường của các bộ sưu tập và dự báo xu hướng thời trang thế giới.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", background: "#FFFFFF", border: "1px solid #E4E4E7" }}>
            <Empty description="Hiện chưa có bài viết nào được xuất bản" />
          </div>
        ) : (
          <Row gutter={[32, 40]}>
            {posts.map((post) => (
              <Col xs={24} sm={12} md={8} key={post.post_id}>
                <Link href={`/news/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="fashion-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ aspectRatio: "16/10", overflow: "hidden", background: "#F4F4F5" }}>
                      <img
                        src={post.thumbnail || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600"}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>

                    <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {new Date(post.created_at).toLocaleDateString("vi-VN")} • {post.author_name || "ÉLÉGANCE"}
                        </div>
                        <h3
                          style={{
                            fontSize: 20,
                            fontFamily: "Cormorant Garamond, serif",
                            fontWeight: 600,
                            margin: "10px 0",
                            color: "#18181B",
                            lineHeight: 1.3,
                          }}>
                          {post.title}
                        </h3>
                        <p
                          style={{
                            color: "#71717A",
                            fontSize: 13,
                            lineHeight: 1.6,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}>
                          {post.summary}
                        </p>
                      </div>

                      <div style={{ marginTop: 16, color: "#C5A880", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        Đọc Tiếp <ArrowRightOutlined />
                      </div>
                    </div>
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </MainLayout>
  );
}
