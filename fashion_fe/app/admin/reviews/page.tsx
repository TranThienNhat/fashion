"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Rate, Space, message, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { reviewBlogAPI, getApiMessage, getApiError } from "@/lib/api";
import type { ProductReview } from "@/lib/types";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewBlogAPI.adminGetReviews({ page: page - 1, size: 10 });
      setReviews(res.data.content || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tải danh sách đánh giá sản phẩm."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const handleDelete = async (id: number) => {
    try {
      const res = await reviewBlogAPI.adminDeleteReview(id);
      message.success(getApiMessage(res, "Đã xóa đánh giá khỏi hệ thống."));
      fetchReviews();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể xóa đánh giá. Vui lòng thử lại sau."));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontFamily: "serif", margin: 0, color: "#18181B" }}>
          Kiểm Duyệt Đánh Giá Sản Phẩm
        </h1>
        <span style={{ fontSize: 13, color: "#71717A" }}>
          Xem xét, kiểm duyệt và loại bỏ các bình luận không phù hợp từ khách hàng
        </span>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: 20 }}>
        <Table
          dataSource={reviews}
          rowKey="review_id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: (p) => setPage(p),
          }}
          columns={[
            {
              title: "Sản phẩm",
              key: "product",
              render: (_, r) => (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <img src={r.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100"} alt="thumb" style={{ width: 40, height: 50, objectFit: "cover" }} />
                  <b>{r.product_name}</b>
                </div>
              ),
            },
            {
              title: "Người đánh giá",
              key: "user",
              render: (_, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{r.user_name}</div>
                  <div style={{ fontSize: 12, color: "#71717A" }}>{r.user_email}</div>
                </div>
              ),
            },
            {
              title: "Số sao",
              dataIndex: "rating",
              key: "rating",
              render: (stars) => <Rate disabled defaultValue={stars} style={{ fontSize: 13, color: "#0D0D0D" }} />,
            },
            {
              title: "Nội dung nhận xét",
              dataIndex: "comment",
              key: "comment",
              render: (c) => <span style={{ fontSize: 13 }}>{c}</span>,
            },
            {
              title: "Ngày gửi",
              dataIndex: "created_at",
              key: "created_at",
              render: (dt) => new Date(dt).toLocaleString("vi-VN"),
            },
            {
              title: "Thao tác",
              key: "action",
              render: (_, r) => (
                <Popconfirm
                  title="Xóa đánh giá này?"
                  description="Bình luận sẽ bị xóa vĩnh viễn khỏi sản phẩm."
                  onConfirm={() => handleDelete(r.review_id)}
                  okText="Xóa"
                  cancelText="Hủy">
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    Xóa
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
