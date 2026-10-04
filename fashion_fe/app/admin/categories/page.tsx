"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { catalogAPI } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await catalogAPI.getCategories();
      const list = res.data?.flat || res.data?.data?.flat || (Array.isArray(res.data) ? res.data : []);
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      message.error("Lỗi tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      form.setFieldsValue({
        name: cat.name,
        slug: cat.slug,
        parent_id: cat.parent_id || undefined,
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const isCurrentlyRoot = editingCategory && !editingCategory.parent_id;
      const childCount = editingCategory
        ? categories.filter((c) => c.parent_id === editingCategory.category_id).length
        : 0;

      // Nếu là nốt root hoặc có con, bắt buộc parent_id phải là null/undefined
      if (isCurrentlyRoot || childCount > 0) {
        values.parent_id = null;
      }

      if (editingCategory) {
        await catalogAPI.adminUpdateCategory(editingCategory.category_id, values);
        message.success("Cập nhật danh mục thành công");
      } else {
        await catalogAPI.adminCreateCategory(values);
        message.success("Thêm danh mục mới thành công");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Lỗi lưu danh mục");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await catalogAPI.adminDeleteCategory(id);
      message.success("Đã ẩn danh mục");
      fetchCategories();
    } catch {
      message.error("Lỗi khi xóa danh mục");
    }
  };

  // Chỉ những danh mục gốc (không có parent_id) mới có thể được chọn làm cha
  const rootCategories = categories.filter((c) => !c.parent_id);

  // Xác định trạng thái của danh mục đang chỉnh sửa
  const isEditingRoot = editingCategory && !editingCategory.parent_id;
  const childCategories = editingCategory
    ? categories.filter((c) => c.parent_id === editingCategory.category_id)
    : [];
  const isLockedAsRoot = isEditingRoot || childCategories.length > 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Cây Danh Mục Sản Phẩm
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Quy định phân cấp chuẩn: Danh mục gốc (Root Node) không được phép đặt làm con của bất kỳ danh mục nào
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
          Thêm Danh Mục Mới
        </Button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: 20 }}>
        <Table
          dataSource={categories}
          rowKey="category_id"
          loading={loading}
          pagination={false}
          columns={[
            {
              title: "Tên danh mục",
              dataIndex: "name",
              key: "name",
              render: (name, rec) => {
                const isRoot = !rec.parent_id;
                const subs = categories.filter((c) => c.parent_id === rec.category_id);
                return (
                  <div style={{ paddingLeft: isRoot ? 0 : 28, display: "flex", alignItems: "center", gap: 8 }}>
                    {isRoot ? (
                      <FolderOpenOutlined style={{ color: "#D97706", fontSize: 16 }} />
                    ) : (
                      <span style={{ color: "#9CA3AF" }}>↳</span>
                    )}
                    <span style={{ fontWeight: isRoot ? 700 : 500, color: isRoot ? "#18181B" : "#3F3F46" }}>
                      {name}
                    </span>
                    {isRoot && subs.length > 0 && (
                      <Tag color="blue" style={{ borderRadius: 0, fontSize: 11, margin: 0 }}>
                        {subs.length} danh mục con
                      </Tag>
                    )}
                  </div>
                );
              },
            },
            {
              title: "Đường dẫn (Slug)",
              dataIndex: "slug",
              key: "slug",
              render: (slug) => <code style={{ color: "#6B7280" }}>{slug}</code>,
            },
            {
              title: "Cấp độ / Danh mục cha",
              dataIndex: "parent_name",
              key: "parent_name",
              render: (p, rec) =>
                rec.parent_id ? (
                  <Tag style={{ borderRadius: 0, background: "#F4F4F5", color: "#3F3F46", border: "1px solid #E4E4E7" }}>
                    ↳ Trực thuộc: <b>{p}</b>
                  </Tag>
                ) : (
                  <Tag color="gold" style={{ borderRadius: 0, fontWeight: 700 }}>
                    📁 CẤP GỐC (ROOT)
                  </Tag>
                ),
            },
            {
              title: "Trạng thái",
              dataIndex: "is_active",
              key: "is_active",
              render: (act) => (
                <Tag color={act ? "green" : "red"} style={{ borderRadius: 0 }}>
                  {act ? "Hiển thị" : "Ẩn"}
                </Tag>
              ),
            },
            {
              title: "Thao tác",
              key: "action",
              render: (_, rec) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(rec)} />
                  <Popconfirm
                    title="Ẩn danh mục này?"
                    description="Các sản phẩm thuộc danh mục này có thể bị ảnh hưởng hiển thị."
                    onConfirm={() => handleDelete(rec.category_id)}
                    okText="Đồng ý"
                    cancelText="Hủy">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ApartmentOutlined style={{ fontSize: 20, color: "#C5A880" }} />
            <span style={{ fontFamily: "serif", fontSize: 20 }}>
              {editingCategory ? `Chỉnh Sửa Danh Mục: ${editingCategory.name}` : "Thêm Danh Mục Mới"}
            </span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Lưu Danh Mục"
        cancelText="Hủy"
        width={580}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {isLockedAsRoot && (
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                padding: "12px 16px",
                borderRadius: 4,
                marginBottom: 20,
                fontSize: 13,
                color: "#92400E",
                lineHeight: 1.5,
              }}>
              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <InfoCircleOutlined /> QUY TẮC CẤP GỐC (ROOT NODE):
              </div>
              <div>
                {childCategories.length > 0
                  ? `Danh mục "${editingCategory?.name}" là nốt gốc và đang quản lý ${childCategories.length} danh mục con trực thuộc. Danh mục gốc không được phép chuyển làm con của bất kỳ danh mục nào khác.`
                  : `Danh mục "${editingCategory?.name}" được xác định là nốt gốc (Root Node). Theo quy định hệ thống, nốt root không thể gán làm con của danh mục nào.`}
              </div>
            </div>
          )}

          <Form.Item
            label="Tên danh mục"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}>
            <Input placeholder="Thời Trang Thiết Kế..." style={{ borderRadius: 0 }} />
          </Form.Item>

          {isLockedAsRoot ? (
            <Form.Item label="Phân cấp danh mục cha">
              <div
                style={{
                  background: "#F4F4F5",
                  border: "1px solid #E4E4E7",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <Tag color="gold" style={{ borderRadius: 0, fontWeight: 700, margin: 0 }}>
                  📁 CẤP GỐC (ROOT NODE) - CỐ ĐỊNH
                </Tag>
                <span style={{ fontSize: 12, color: "#71717A" }}>Khóa cố định cấp gốc</span>
              </div>
            </Form.Item>
          ) : (
            <Form.Item
              label="Danh mục cha (Chọn nếu muốn là danh mục con)"
              name="parent_id"
              tooltip="Để trống nếu muốn tạo danh mục Cấp Gốc (Root Node). Chọn danh mục cha nếu muốn tạo danh mục con.">
              <Select
                placeholder="-- Cấp Gốc (Root Node) - Không có cha --"
                allowClear
                style={{ borderRadius: 0 }}
                options={[
                  ...rootCategories
                    .filter((p) => !editingCategory || p.category_id !== editingCategory.category_id)
                    .map((p) => ({
                      value: p.category_id,
                      label: `↳ Trực thuộc danh mục gốc: ${p.name}`,
                    })),
                ]}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Đường dẫn (Slug)"
            name="slug"
            tooltip="Để trống hệ thống sẽ tự sinh slug chuẩn SEO không dấu từ tên danh mục.">
            <Input placeholder="thoi-trang-thiet-ke" style={{ borderRadius: 0 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
