"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { catalogAPI, getApiMessage, getApiError } from "@/lib/api";
import type { Brand } from "@/lib/types";
import ImageUploader from "@/components/ImageUploader";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form] = Form.useForm();

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await catalogAPI.getBrands();
      const bList = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setBrands(Array.isArray(bList) ? bList : []);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tải danh sách thương hiệu thời trang."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenModal = (b?: Brand) => {
    if (b) {
      setEditingBrand(b);
      form.setFieldsValue(b);
    } else {
      setEditingBrand(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingBrand) {
        const res = await catalogAPI.adminUpdateBrand(editingBrand.brand_id, values);
        message.success(getApiMessage(res, "Cập nhật thương hiệu thành công."));
      } else {
        const res = await catalogAPI.adminCreateBrand(values);
        message.success(getApiMessage(res, "Thêm thương hiệu mới thành công."));
      }
      setIsModalOpen(false);
      fetchBrands();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể lưu thông tin thương hiệu. Vui lòng kiểm tra lại."));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await catalogAPI.adminDeleteBrand(id);
      message.success(getApiMessage(res, "Đã xóa thương hiệu khỏi hệ thống."));
      fetchBrands();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể xóa thương hiệu."));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Thương Hiệu Thời Trang
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Danh sách các nhãn hàng đối tác và nhà mốt thời trang
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
          Thêm Thương Hiệu Mới
        </Button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: 20 }}>
        <Table
          dataSource={brands}
          rowKey="brand_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Thương hiệu",
              dataIndex: "name",
              key: "name",
              render: (name, rec) => (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {rec.logo_url && (
                    <img src={rec.logo_url} alt={name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "50%" }} />
                  )}
                  <b>{name}</b>
                </div>
              ),
            },
            { title: "Đường dẫn (Slug)", dataIndex: "slug", key: "slug" },
            {
              title: "Thao tác",
              key: "action",
              render: (_, rec) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(rec)} />
                  <Popconfirm title="Xóa thương hiệu này?" onConfirm={() => handleDelete(rec.brand_id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={<span style={{ fontFamily: "serif", fontSize: 20 }}>{editingBrand ? "Chỉnh Sửa Thương Hiệu" : "Thêm Thương Hiệu"}</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Tên thương hiệu" name="name" rules={[{ required: true }]}>
            <Input placeholder="Dior, Chanel, Saint Laurent..." />
          </Form.Item>
          <Form.Item label="Logo thương hiệu (Tải lên từ máy tính hoặc liên kết)" name="logo_url">
            <ImageUploader aspectRatio="1/1" placeholderText="Nhấp hoặc kéo thả logo thương hiệu để tải lên server" />
          </Form.Item>
          <Form.Item label="Slug (Tùy chọn)" name="slug">
            <Input placeholder="dior" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
