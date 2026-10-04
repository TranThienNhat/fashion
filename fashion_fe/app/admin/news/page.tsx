"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Switch, Space, message, Popconfirm, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { reviewBlogAPI, getApiMessage, getApiError } from "@/lib/api";
import type { BlogPost } from "@/lib/types";
import ImageUploader from "@/components/ImageUploader";

export default function AdminNewsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form] = Form.useForm();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await reviewBlogAPI.adminGetBlogPosts({ page: page - 1, size: 10 });
      const pList = res.data?.content || res.data?.data?.content || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      setPosts(Array.isArray(pList) ? pList : []);
      setTotal(res.data?.total || 0);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tải danh sách bài viết tạp chí."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const handleOpenModal = (p?: BlogPost) => {
    if (p) {
      setEditingPost(p);
      form.setFieldsValue({
        ...p,
        is_published: Boolean(p.is_published),
      });
    } else {
      setEditingPost(null);
      form.resetFields();
      form.setFieldsValue({
        is_published: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        slug: editingPost?.slug || undefined,
        is_published: Boolean(values.is_published),
      };

      if (editingPost) {
        const res = await reviewBlogAPI.adminUpdateBlog(editingPost.post_id, payload);
        message.success(getApiMessage(res, "Cập nhật bài viết thành công."));
      } else {
        const res = await reviewBlogAPI.adminCreateBlog(payload);
        message.success(getApiMessage(res, "Đăng bài viết mới thành công."));
      }
      setIsModalOpen(false);
      fetchPosts();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể lưu bài viết. Vui lòng kiểm tra lại."));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await reviewBlogAPI.adminDeleteBlog(id);
      message.success(getApiMessage(res, "Đã xóa bài viết thành công."));
      fetchPosts();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể xóa bài viết. Vui lòng thử lại."));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Trị Tạp Chí & Tin Tức Thời Trang
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Biên tập các bài viết xu hướng, phong cách phối đồ và ấn phẩm thời trang
          </span>
        </div>

        <Button
          type="primary"
          onClick={() => handleOpenModal()}
          style={{
            background: "#0D0D0D",
            borderColor: "#0D0D0D",
            borderRadius: 0,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            height: 38,
          }}
          icon={<PlusOutlined />}>
          Viết Bài Mới
        </Button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: 20 }}>
        <Table
          dataSource={posts}
          rowKey="post_id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: (p) => setPage(p),
          }}
          columns={[
            {
              title: "Bài viết",
              key: "title",
              render: (_, r) => (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {r.thumbnail && (
                    <img src={r.thumbnail} alt="thumb" style={{ width: 60, height: 40, objectFit: "cover" }} />
                  )}
                  <div>
                    <b>{r.title}</b>
                    <div style={{ fontSize: 12, color: "#71717A" }}>/{r.slug}</div>
                  </div>
                </div>
              ),
            },
            { title: "Tác giả", dataIndex: "author_name", key: "author_name" },
            {
              title: "Trạng thái",
              dataIndex: "is_published",
              key: "is_published",
              render: (pub, r) => (
                <Space>
                  <Switch
                    checked={Boolean(pub)}
                    size="small"
                    checkedChildren="Đăng"
                    unCheckedChildren="Nháp"
                    onChange={async (checked) => {
                      try {
                        await reviewBlogAPI.adminToggleBlogStatus(r.post_id, checked);
                        message.success(checked ? "Đã xuất bản bài viết" : "Đã chuyển về bản nháp");
                        fetchPosts();
                      } catch {
                        message.error("Lỗi cập nhật trạng thái");
                      }
                    }}
                  />
                  <Tag color={Boolean(pub) ? "green" : "default"}>
                    {Boolean(pub) ? "Đã xuất bản" : "Bản nháp"}
                  </Tag>
                </Space>
              ),
            },
            {
              title: "Ngày đăng",
              dataIndex: "created_at",
              key: "created_at",
              render: (dt) => new Date(dt).toLocaleDateString("vi-VN"),
            },
            {
              title: "Thao tác",
              key: "action",
              render: (_, r) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(r)} />
                  <Popconfirm title="Xóa bài viết này?" onConfirm={() => handleDelete(r.post_id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={<span style={{ fontFamily: "serif", fontSize: 20 }}>{editingPost ? "Chỉnh Sửa Bài Viết" : "Viết Bài Mới"}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Lưu Bài Viết"
        cancelText="Hủy"
        width={750}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Tiêu đề bài viết" name="title" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}>
            <Input placeholder="Xu Hướng Thời Trang Thu Đông 2026..." />
          </Form.Item>
          <Form.Item label="Ảnh đại diện bài viết (Tải lên từ máy tính hoặc liên kết)" name="thumbnail">
            <ImageUploader aspectRatio="16/9" placeholderText="Nhấp hoặc kéo thả ảnh bìa bài viết để tải lên server" />
          </Form.Item>
          <Form.Item label="Tóm tắt ngắn (Lead)" name="summary">
            <Input.TextArea rows={2} placeholder="Tóm tắt ngắn gọn nội dung bài viết..." />
          </Form.Item>
          <Form.Item label="Nội dung bài viết" name="content" rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}>
            <Input.TextArea rows={8} placeholder="Nội dung bài viết chi tiết..." />
          </Form.Item>
          <Form.Item label="Xuất bản công khai" name="is_published" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="Có" unCheckedChildren="Bản nháp" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
