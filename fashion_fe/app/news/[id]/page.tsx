"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Spin, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { reviewBlogAPI } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewsDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slugOrId = resolvedParams.id;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const res = await reviewBlogAPI.getBlogDetail(slugOrId);
        setPost(res.data);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [slugOrId]);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "120px 0" }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "100px 24px" }}>
          <h2>Không tìm thấy bài viết</h2>
          <Link href="/news">
            <Button type="primary" style={{ marginTop: 16 }}>
              Quay lại danh sách bài viết
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <article style={{ maxWidth: 840, margin: "0 auto", padding: "48px 24px" }}>
        <Link href="/news" style={{ color: "#71717A", textDecoration: "none", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
          <ArrowLeftOutlined /> Quay lại Tạp chí
        </Link>

        <div style={{ fontSize: 12, color: "#C5A880", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
          XU HƯỚNG & PHONG CÁCH
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontFamily: "Cormorant Garamond, serif",
            fontWeight: 700,
            margin: "12px 0 16px",
            lineHeight: 1.25,
            color: "#18181B",
          }}>
          {post.title}
        </h1>

        <div style={{ fontSize: 13, color: "#71717A", paddingBottom: 24, borderBottom: "1px solid #E4E4E7", marginBottom: 32 }}>
          Đăng ngày {new Date(post.created_at).toLocaleDateString("vi-VN")} • Tác giả: <b>{post.author_name || "ÉLÉGANCE"}</b>
        </div>

        {post.thumbnail && (
          <div style={{ aspectRatio: "16/9", overflow: "hidden", marginBottom: 40, background: "#F4F4F5" }}>
            <img src={post.thumbnail} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {post.summary && (
          <div
            style={{
              fontSize: 18,
              fontStyle: "italic",
              color: "#3F3F46",
              lineHeight: 1.8,
              borderLeft: "3px solid #C5A880",
              paddingLeft: 20,
              marginBottom: 32,
              fontFamily: "Cormorant Garamond, serif",
            }}>
            {post.summary}
          </div>
        )}

        <div
          style={{
            fontSize: 16,
            lineHeight: 2,
            color: "#27272A",
            whiteSpace: "pre-line",
          }}>
          {post.content}
        </div>
      </article>
    </MainLayout>
  );
}
