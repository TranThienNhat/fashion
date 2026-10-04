"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Tag,
  Modal,
  Form,
  Select,
  InputNumber,
  Row,
  Col,
  Space,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { catalogAPI, uploadAPI, getApiMessage, getApiError } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import type { Product, Category, Brand } from "@/lib/types";
import ImageUploader from "@/components/ImageUploader";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [variantsList, setVariantsList] = useState<any[]>([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await catalogAPI.adminGetProducts({
        page: page - 1,
        size: 10,
        search,
      });
      setProducts(res.data.content || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tải danh sách sản phẩm. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [cRes, bRes] = await Promise.all([
          catalogAPI.getCategories(),
          catalogAPI.getBrands(),
        ]);
        const cats = cRes.data?.flat || cRes.data?.data?.flat || cRes.data?.data || (Array.isArray(cRes.data) ? cRes.data : []);
        setCategories(Array.isArray(cats) ? cats : []);
        const brs = bRes.data?.data || bRes.data?.items || (Array.isArray(bRes.data) ? bRes.data : []);
        setBrands(Array.isArray(brs) ? brs : []);
      } catch (err) {
        console.error(err);
      }
    }
    loadMeta();
  }, []);

  const handleOpenModal = async (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      // Fetch full details with variants
      try {
        const detailRes = await catalogAPI.getProductDetail(prod.product_id);
        const fullProd = detailRes.data;
        form.setFieldsValue({
          name: fullProd.name,
          category_id: fullProd.category_id,
          brand_id: fullProd.brand_id,
          base_price: fullProd.base_price,
          thumbnail: fullProd.thumbnail,
          description: fullProd.description,
        });
        setVariantsList(fullProd.variants || []);
      } catch (err: any) {
        message.error(getApiError(err, "Không thể tải chi tiết thông tin sản phẩm."));
      }
    } else {
      setEditingProduct(null);
      form.resetFields();
      setVariantsList([
        { color: "Đen", size: "S", sku: "", price: 1000000, stock_quantity: 20 },
        { color: "Đen", size: "M", sku: "", price: 1000000, stock_quantity: 20 },
      ]);
    }
    setIsModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariantsList([
      ...variantsList,
      { color: "Trắng", size: "M", sku: "", price: 1000000, stock_quantity: 10 },
    ]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    setVariantsList(variantsList.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx: number, field: string, val: any) => {
    const updated = [...variantsList];
    updated[idx][field] = val;
    setVariantsList(updated);
  };

  const handleSaveProduct = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        variants: variantsList,
      };

      if (editingProduct) {
        const res = await catalogAPI.adminUpdateProduct(editingProduct.product_id, payload);
        message.success(getApiMessage(res, "Cập nhật sản phẩm thành công."));
      } else {
        const res = await catalogAPI.adminCreateProduct(payload);
        message.success(getApiMessage(res, "Thêm sản phẩm mới thành công."));
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể lưu sản phẩm. Vui lòng kiểm tra lại thông tin."));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await catalogAPI.adminDeleteProduct(id);
      message.success(getApiMessage(res, "Đã cập nhật trạng thái ngừng kinh doanh sản phẩm."));
      fetchProducts();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể thao tác với sản phẩm. Vui lòng thử lại."));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Sản Phẩm & Biến Thể
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Quản lý thông tin thời trang, bảng màu, kích cỡ và tồn kho biến thể
          </span>
        </div>

        <Space>
          <Input
            placeholder="Tìm theo tên sản phẩm..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240, borderRadius: 0 }}
          />
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
            Thêm Sản Phẩm Mới
          </Button>
        </Space>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: 20 }}>
        <Table
          dataSource={products}
          rowKey="product_id"
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
              dataIndex: "name",
              key: "name",
              render: (name, record) => (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img
                    src={record.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100"}
                    alt={name}
                    style={{ width: 44, height: 56, objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 12, color: "#71717A" }}>
                      {record.brand_name || "N/A"} • {record.category_name || "N/A"}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: "Giá niêm yết",
              dataIndex: "base_price",
              key: "base_price",
              render: (v) => <b>{formatPrice(v)}</b>,
            },
            {
              title: "Biến thể",
              dataIndex: "variant_count",
              key: "variant_count",
              render: (c) => <Tag color="blue">{c} biến thể</Tag>,
            },
            {
              title: "Tổng tồn kho",
              dataIndex: "total_stock",
              key: "total_stock",
              render: (qty) => (
                <Tag color={qty <= 10 ? "warning" : "success"}>
                  {qty} chiếc
                </Tag>
              ),
            },
            {
              title: "Trạng thái",
              dataIndex: "is_active",
              key: "is_active",
              render: (act) => (
                <Tag color={act ? "green" : "red"}>
                  {act ? "Đang bán" : "Đã ẩn"}
                </Tag>
              ),
            },
            {
              title: "Hành động",
              key: "action",
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
                  <Popconfirm
                    title="Ẩn sản phẩm?"
                    description="Sản phẩm sẽ không còn xuất hiện trên cửa hàng storefront."
                    onConfirm={() => handleDeleteProduct(record.product_id)}
                    okText="Ẩn"
                    cancelText="Hủy">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </div>

      {/* Modal Thêm / Chỉnh Sửa Sản Phẩm */}
      <Modal
        title={
          <span style={{ fontFamily: "serif", fontSize: 20 }}>
            {editingProduct ? `Chỉnh Sửa Sản Phẩm #${editingProduct.product_id}` : "Thêm Sản Phẩm Mới"}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveProduct}
        okText="Lưu Sản Phẩm"
        cancelText="Hủy"
        width={850}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}>
                <Input placeholder="Áo Blazer Cashmere May Đo..." style={{ borderRadius: 0 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Giá niêm yết (VNĐ)" name="base_price" rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%", borderRadius: 0 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Danh mục sản phẩm" name="category_id" rules={[{ required: true }]}>
                <Select placeholder="Chọn danh mục" style={{ borderRadius: 0 }}>
                  {(Array.isArray(categories) ? categories : []).map((c) => (
                    <Select.Option key={c.category_id} value={c.category_id}>
                      {c.parent_id ? "↳ " : ""}{c.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thương hiệu" name="brand_id">
                <Select placeholder="Chọn thương hiệu" allowClear style={{ borderRadius: 0 }}>
                  {(Array.isArray(brands) ? brands : []).map((b) => (
                    <Select.Option key={b.brand_id} value={b.brand_id}>
                      {b.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Ảnh đại diện sản phẩm (Tải lên từ máy tính hoặc liên kết)" name="thumbnail">
            <ImageUploader aspectRatio="3/4" placeholderText="Nhấp hoặc kéo thả ảnh từ máy tính để tải lên server" />
          </Form.Item>

          <Form.Item label="Mô tả chi tiết sản phẩm" name="description">
            <Input.TextArea rows={3} placeholder="Chất liệu sợi tự nhiên, xuất xứ, phom dáng..." style={{ borderRadius: 0 }} />
          </Form.Item>

          {/* Ma Trận Quản Lý Biến Thể */}
          <div style={{ borderTop: "1px solid #E4E4E7", paddingTop: 16, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <b style={{ fontSize: 14 }}>Ma Trận Biến Thể Thời Trang (Color / Size / SKU / Giá / Tồn Kho):</b>
              <Button size="small" onClick={handleAddVariantRow} icon={<PlusOutlined />}>
                Thêm Dòng Biến Thể
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {variantsList.map((v, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", background: "#FAFAF9", border: "1px solid #EAEAE8", padding: 8 }}>
                  <Input
                    placeholder="Màu (vd: Đen)"
                    value={v.color}
                    onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                    style={{ width: 110 }}
                  />
                  <Input
                    placeholder="Size (vd: M)"
                    value={v.size}
                    onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                    style={{ width: 90 }}
                  />
                  <Input
                    placeholder="SKU (Tự sinh nếu trống)"
                    value={v.sku}
                    onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <InputNumber
                    placeholder="Giá bán"
                    value={v.price}
                    onChange={(val) => handleVariantChange(idx, "price", val)}
                    style={{ width: 130 }}
                  />
                  <InputNumber
                    placeholder="Tồn kho"
                    value={v.stock_quantity}
                    onChange={(val) => handleVariantChange(idx, "stock_quantity", val)}
                    style={{ width: 90 }}
                  />
                  <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveVariantRow(idx)} />
                </div>
              ))}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
