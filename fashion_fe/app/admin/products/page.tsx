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
  Switch,
  message,
  Popconfirm,
  Tooltip,
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
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [variantsList, setVariantsList] = useState<any[]>([]);
  const [hasVariants, setHasVariants] = useState<boolean>(true);
  const [isAccessoryMode, setIsAccessoryMode] = useState<boolean>(false);

  // Kiểm tra xem sản phẩm hoặc danh mục có thuộc nhóm phụ kiện không
  const checkIfAccessory = (catId?: number, prodName?: string) => {
    const name = (prodName || "").toLowerCase();
    const isNameAccessory =
      name.includes("túi") ||
      name.includes("ví") ||
      name.includes("thắt lưng") ||
      name.includes("kính") ||
      name.includes("đồng hồ") ||
      name.includes("phụ kiện");

    if (!catId) return isNameAccessory;
    const selectedCat = categories.find((c) => c.category_id === catId);
    if (!selectedCat) return isNameAccessory;

    const slug = (selectedCat.slug || "").toLowerCase();
    const catName = (selectedCat.name || "").toLowerCase();
    return (
      isNameAccessory ||
      slug.includes("phu-kien") ||
      slug.includes("tui-xach") ||
      slug.includes("that-lung") ||
      slug.includes("dong-ho") ||
      slug.includes("kinh") ||
      slug.includes("vi-da") ||
      catName.includes("phụ kiện") ||
      catName.includes("túi xách") ||
      catName.includes("thắt lưng") ||
      catName.includes("đồng hồ") ||
      catName.includes("kính") ||
      catName.includes("ví")
    );
  };

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
        const isVar = fullProd.has_variants !== undefined ? Boolean(fullProd.has_variants) : (prod.has_variants !== undefined ? Boolean(prod.has_variants) : true);
        setHasVariants(isVar);

        const isAcc = checkIfAccessory(fullProd.category_id, fullProd.name);
        setIsAccessoryMode(isAcc);

        form.setFieldsValue({
          name: fullProd.name,
          category_id: fullProd.category_id,
          brand_id: fullProd.brand_id,
          base_price: fullProd.base_price,
          thumbnail: fullProd.thumbnail,
          description: fullProd.description,
          stock_quantity: fullProd.variants?.[0]?.stock_quantity ?? fullProd.total_stock ?? 50,
          sku: fullProd.variants?.[0]?.sku ?? "",
        });
        const vList = fullProd.variants || [];
        setVariantsList(
          isAcc
            ? vList.map((v: any) => ({ ...v, size: v.size || "Tiêu chuẩn" }))
            : vList
        );
      } catch (err: any) {
        message.error(getApiError(err, "Không thể tải chi tiết thông tin sản phẩm."));
      }
    } else {
      setEditingProduct(null);
      setHasVariants(true);
      setIsAccessoryMode(false);
      form.resetFields();
      form.setFieldsValue({
        stock_quantity: 50,
        sku: "",
      });
      setVariantsList([
        { color: "Đen", size: "S", sku: "", price: 1000000, stock_quantity: 20 },
        { color: "Đen", size: "M", sku: "", price: 1000000, stock_quantity: 20 },
      ]);
    }
    setIsModalOpen(true);
  };

  const handleCategorySelect = (catId: number) => {
    form.setFieldValue("category_id", catId);
    const isAcc = checkIfAccessory(catId, form.getFieldValue("name"));
    setIsAccessoryMode(isAcc);
    if (isAcc) {
      setHasVariants(true);
      setVariantsList((prev) => {
        if (!prev || prev.length === 0) {
          return [{ color: "Đen", size: "Tiêu chuẩn", sku: "", price: form.getFieldValue("base_price") || 1000000, stock_quantity: 20 }];
        }
        return prev.map((v) => ({ ...v, size: "Tiêu chuẩn" }));
      });
    }
  };

  const handleAddVariantRow = () => {
    const basePrice = form.getFieldValue("base_price") || 1000000;
    if (isAccessoryMode) {
      setVariantsList([
        ...variantsList,
        { color: "", size: "Tiêu chuẩn", sku: "", price: basePrice, stock_quantity: 10 },
      ]);
    } else {
      setVariantsList([
        ...variantsList,
        { color: "Trắng", size: "M", sku: "", price: basePrice, stock_quantity: 10 },
      ]);
    }
  };

  const handleRemoveVariantRow = async (idx: number, v?: any) => {
    if (v && v.variant_id) {
      try {
        const res = await catalogAPI.adminDeleteVariant(v.variant_id);
        message.success(getApiMessage(res, `Đã xóa vĩnh viễn biến thể (${v.color || ""} ${v.size || ""}) khỏi DB.`));
        setVariantsList((prev) => prev.filter((_, i) => i !== idx));
        fetchProducts();
      } catch (err: any) {
        message.error(getApiError(err, "Không thể xóa biến thể này. Có thể biến thể đã phát sinh đơn hàng hoặc phiếu nhập kho."));
      }
    } else {
      setVariantsList((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleVariantChange = (idx: number, field: string, val: any) => {
    const updated = [...variantsList];
    updated[idx][field] = val;
    setVariantsList(updated);
  };

  const handleSaveProduct = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        ...values,
        has_variants: hasVariants,
      };

      if (hasVariants) {
        payload.variants = variantsList.map((v) => ({
          ...v,
          size: isAccessoryMode ? "Tiêu chuẩn" : (v.size || "Tiêu chuẩn"),
        }));
      } else {
        payload.stock_quantity = values.stock_quantity ?? 0;
        payload.sku = values.sku ?? "";
      }

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

  const handleToggleActiveProduct = async (prod: Product, newActive: boolean) => {
    try {
      if (newActive) {
        const res = await catalogAPI.adminUpdateProduct(prod.product_id, {
          name: prod.name,
          category_id: prod.category_id,
          brand_id: prod.brand_id,
          base_price: prod.base_price,
          description: prod.description,
          thumbnail: prod.thumbnail,
          is_active: true,
        });
        message.success(getApiMessage(res, `Đã mở bán hiển thị lại sản phẩm '${prod.name}'.`));
      } else {
        const res = await catalogAPI.adminDeleteProduct(prod.product_id, false);
        message.success(getApiMessage(res, `Đã tạm ẩn sản phẩm '${prod.name}' khỏi storefront.`));
      }
      fetchProducts();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể cập nhật trạng thái sản phẩm."));
    }
  };

  const handlePurgeProduct = async (prod: Product) => {
    try {
      const res = await catalogAPI.adminDeleteProduct(prod.product_id, true);
      message.success(getApiMessage(res, `Đã xóa vĩnh viễn sản phẩm '${prod.name}' khỏi Database.`));
      fetchProducts();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể xóa vĩnh viễn sản phẩm."));
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
              title: "Phân loại / Biến thể",
              dataIndex: "variant_count",
              key: "variant_count",
              render: (c, record) => {
                const isAcc = checkIfAccessory(record.category_id, record.name);
                if (record.has_variants === false) {
                  return <Tag color="purple">{isAcc ? "Phụ kiện (Đơn lẻ)" : "Đơn lẻ"}</Tag>;
                }
                return isAcc ? (
                  <Tag color="cyan">{c} màu sắc (Không size)</Tag>
                ) : (
                  <Tag color="blue">{c} biến thể</Tag>
                );
              },
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
                  <Tooltip title="Chỉnh sửa thông tin & biến thể">
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
                  </Tooltip>

                  {record.is_active ? (
                    <Popconfirm
                      title="Ẩn sản phẩm?"
                      description="Sản phẩm sẽ tạm ngừng hiển thị trên trang bán hàng (vẫn lưu trữ trong DB)."
                      onConfirm={() => handleToggleActiveProduct(record, false)}
                      okText="Ẩn"
                      cancelText="Hủy">
                      <Tooltip title="Tạm ẩn khỏi cửa hàng">
                        <Button size="small" style={{ color: "#D97706", borderColor: "#FCD34D", fontSize: 12 }}>
                          Ẩn
                        </Button>
                      </Tooltip>
                    </Popconfirm>
                  ) : (
                    <Tooltip title="Kích hoạt bán lại trên cửa hàng">
                      <Button
                        size="small"
                        onClick={() => handleToggleActiveProduct(record, true)}
                        style={{ color: "#16A34A", borderColor: "#86EFAC", fontSize: 12, fontWeight: 500 }}>
                        Hiện lại
                      </Button>
                    </Tooltip>
                  )}

                  <Tooltip title="Tùy chọn xóa (Chỉ Ẩn hoặc Xóa hẳn khỏi DB)">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setDeleteModalProduct(record)}
                    />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
        />
      </div>

      {/* Modal Tùy Chọn Xóa Sản Phẩm */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626" }}>
            <DeleteOutlined style={{ fontSize: 18 }} />
            <span style={{ fontFamily: "serif", fontSize: 18, color: "#111827" }}>
              Tùy Chọn Xóa Sản Phẩm
            </span>
          </div>
        }
        open={!!deleteModalProduct}
        onCancel={() => setDeleteModalProduct(null)}
        footer={null}
        width={500}>
        <div style={{ padding: "8px 0" }}>
          <p style={{ fontSize: 14, color: "#1F2937", marginBottom: 12 }}>
            Bạn muốn thực hiện thao tác xóa nào đối với sản phẩm: <b>{deleteModalProduct?.name}</b>?
          </p>

          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", padding: "12px 14px", borderRadius: 4, fontSize: 13, color: "#4B5563", lineHeight: 1.6, marginBottom: 20 }}>
            <div>
              🟡 <b>Chỉ Ẩn Sản Phẩm:</b> Sản phẩm sẽ tạm dừng hiển thị đối với khách hàng trên storefront, nhưng vẫn bảo lưu toàn bộ dữ liệu, biến thể và lịch sử đơn hàng.
            </div>
            <div style={{ marginTop: 8 }}>
              🔴 <b>Xác Nhận Xóa Hẳn Khỏi DB:</b> Sản phẩm và toàn bộ biến thể sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu MySQL (chỉ khả dụng khi sản phẩm chưa phát sinh đơn hàng).
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => setDeleteModalProduct(null)}>
              Hủy
            </Button>

            {deleteModalProduct?.is_active && (
              <Button
                style={{ color: "#D97706", borderColor: "#FCD34D" }}
                onClick={() => {
                  if (deleteModalProduct) {
                    handleToggleActiveProduct(deleteModalProduct, false);
                    setDeleteModalProduct(null);
                  }
                }}>
                Chỉ Ẩn Sản Phẩm
              </Button>
            )}

            <Popconfirm
              title="Xóa vĩnh viễn sản phẩm?"
              description="Thao tác này không thể hoàn tác. Dữ liệu sản phẩm và biến thể sẽ bị xóa hoàn toàn khỏi Database!"
              onConfirm={() => {
                if (deleteModalProduct) {
                  handlePurgeProduct(deleteModalProduct);
                  setDeleteModalProduct(null);
                }
              }}
              okText="Đồng ý xóa hẳn"
              okButtonProps={{ danger: true }}
              cancelText="Hủy">
              <Button type="primary" danger>
                Xác Nhận Xóa Hẳn Khỏi DB
              </Button>
            </Popconfirm>
          </div>
        </div>
      </Modal>

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
                <Select
                  placeholder="Chọn danh mục"
                  style={{ borderRadius: 0 }}
                  onChange={handleCategorySelect}>
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

          {/* Cấu Hình Phân Loại / Biến Thể */}
          <div style={{ borderTop: "1px solid #E4E4E7", paddingTop: 16, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, background: "#F4F4F5", padding: "10px 14px", borderRadius: 4, flexWrap: "wrap", gap: 10 }}>
              <div>
                <b style={{ fontSize: 13, color: "#18181B" }}>
                  {isAccessoryMode
                    ? "Cấu hình biến thể Phụ Kiện (Chỉ quản lý Màu sắc):"
                    : "Sản phẩm có biến thể (Kích thước / Màu sắc):"}
                </b>
                <div style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>
                  {isAccessoryMode
                    ? "Chế độ phụ kiện: Phân loại theo Màu Sắc, kích thước tự động lưu Tiêu chuẩn (không cần nhập Size)."
                    : (hasVariants
                        ? "BẬT: Dành cho quần áo thời trang cần ma trận chọn Size S/M/L và nhiều màu sắc."
                        : "TẮT: Dành cho sản phẩm đơn lẻ (chỉ cần nhập tồn kho & SKU tổng).")}
                </div>
              </div>
              <Space>
                <Switch
                  checked={isAccessoryMode}
                  onChange={(checked) => {
                    setIsAccessoryMode(checked);
                    if (checked) {
                      setVariantsList((prev) =>
                        prev.map((v) => ({ ...v, size: "Tiêu chuẩn" }))
                      );
                    }
                  }}
                  checkedChildren="Phụ kiện (Chỉ màu)"
                  unCheckedChildren="Trang phục (Size + Màu)"
                />
                <Switch
                  checked={hasVariants}
                  onChange={(checked) => setHasVariants(checked)}
                  checkedChildren="Có biến thể"
                  unCheckedChildren="Đơn lẻ"
                />
              </Space>
            </div>

            {!hasVariants ? (
              <div style={{ background: "#FAFAF9", border: "1px dashed #D4D4D8", padding: 16, borderRadius: 4 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontWeight: 600 }}>Số lượng tồn kho sản phẩm</span>}
                      name="stock_quantity"
                      rules={[{ required: true, message: "Vui lòng nhập số lượng tồn kho" }]}>
                      <InputNumber min={0} style={{ width: "100%", borderRadius: 0 }} placeholder="Ví dụ: 100" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontWeight: 600 }}>Mã SKU sản phẩm (Tùy chọn)</span>}
                      name="sku">
                      <Input placeholder="Tự sinh nếu để trống (vd: PK-DA-01)" style={{ borderRadius: 0 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{ fontSize: 12, color: "#8F877F", fontStyle: "italic" }}>
                  💡 Lưu ý: Phụ kiện hoặc sản phẩm đơn chiếc sẽ tự động tạo 1 quy cách tiêu chuẩn (One Size) để khách hàng có thể thêm vào giỏ và đặt mua ngay mà không cần chọn size rườm rà.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <b style={{ fontSize: 14 }}>
                      {isAccessoryMode
                        ? "Danh Sách Màu Sắc Phụ Kiện (Chỉ Phân Loại Màu - Không Cần Size):"
                        : "Ma Trận Biến Thể Thời Trang (Color / Size / SKU / Giá / Tồn Kho):"}
                    </b>
                    {isAccessoryMode && (
                      <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>
                        ✓ Phụ kiện chỉ cần cấu hình Màu Sắc, giá và tồn kho. Kích thước đã được tối ưu tiêu chuẩn.
                      </div>
                    )}
                  </div>
                  <Button size="small" onClick={handleAddVariantRow} icon={<PlusOutlined />}>
                    {isAccessoryMode ? "Thêm Màu Mới" : "Thêm Dòng Biến Thể"}
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {variantsList.map((v, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", background: "#FAFAF9", border: "1px solid #EAEAE8", padding: 8 }}>
                      <Input
                        placeholder="Màu sắc (vd: Đen, Nâu...)"
                        value={v.color}
                        onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                        style={{ width: isAccessoryMode ? 170 : 110 }}
                      />
                      {!isAccessoryMode && (
                        <Input
                          placeholder="Size (vd: M)"
                          value={v.size}
                          onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                          style={{ width: 90 }}
                        />
                      )}
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
                      <Popconfirm
                        title="Xóa biến thể này?"
                        description={
                          v.variant_id
                            ? `Xác nhận xóa hẳn biến thể (${v.color || ""}${!isAccessoryMode ? ` - ${v.size || ""}` : ""}) khỏi Database?`
                            : "Xóa dòng biến thể chưa lưu này?"
                        }
                        onConfirm={() => handleRemoveVariantRow(idx, v)}
                        okText="Xóa hẳn"
                        okButtonProps={{ danger: true }}
                        cancelText="Hủy">
                        <Tooltip title={v.variant_id ? "Xóa vĩnh viễn khỏi Database" : "Xóa dòng"}>
                          <Button danger size="small" icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
