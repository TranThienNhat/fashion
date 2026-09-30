"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
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
      form.setFieldsValue(cat);
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
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

  const parentOptions = categories.filter((c) => !c.parent_id);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Cây Danh Mục Sản Phẩm
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Hỗ trợ phân cấp danh mục cha - con đa cấp
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
              render: (name, rec) => (
                <span style={{ paddingLeft: rec.parent_id ? 24 : 0, fontWeight: rec.parent_id ? 400 : 700 }}>
                  {rec.parent_id ? "↳ " : "📁 "}
                  {name}
                </span>
              ),
            },
            { title: "Đường dẫn (Slug)", dataIndex: "slug", key: "slug" },
            {
              title: "Danh mục cha",
              dataIndex: "parent_name",
              key: "parent_name",
              render: (p) => p || <span style={{ color: "#A1A1AA" }}>[Cấp gốc]</span>,
            },
            {
              title: "Trạng thái",
              dataIndex: "is_active",
              key: "is_active",
              render: (act) => <Tag color={act ? "green" : "red"}>{act ? "Hiển thị" : "Ẩn"}</Tag>,
            },
            {
              title: "Thao tác",
              key: "action",
              render: (_, rec) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(rec)} />
                  <Popconfirm title="Ẩn danh mục này?" onConfirm={() => handleDelete(rec.category_id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={<span style={{ fontFamily: "serif", fontSize: 20 }}>{editingCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Tên danh mục" name="name" rules={[{ required: true }]}>
            <Input placeholder="Áo Sơ Mi Nam..." />
          </Form.Item>
          <Form.Item label="Danh mục cha (Tùy chọn)" name="parent_id">
            <Select placeholder="Chọn danh mục cha nếu là danh mục con" allowClear>
              {(Array.isArray(parentOptions) ? parentOptions : []).map((p) => (
                <Select.Option key={p.category_id} value={p.category_id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Slug (Tự động sinh nếu để trống)" name="slug">
            <Input placeholder="ao-so-mi-nam" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
