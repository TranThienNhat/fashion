"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Space,
  message,
  Tabs,
  Popconfirm,
  Row,
  Col,
  Empty,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  ShopOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { warehouseAPI } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import type { Supplier, PurchaseReceipt, WarehouseVariant } from "@/lib/types";

export default function AdminInventoryPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [variants, setVariants] = useState<WarehouseVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [variantSearch, setVariantSearch] = useState("");

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm] = Form.useForm();

  // Receipt modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptForm] = Form.useForm();
  const [receiptItems, setReceiptItems] = useState<any[]>([
    { variant_id: undefined, import_price: 500000, quantity: 20 },
  ]);

  // Detail modal
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [supRes, recRes, varRes] = await Promise.all([
        warehouseAPI.adminGetSuppliers(),
        warehouseAPI.adminGetReceipts({ page: 0, size: 50 }),
        warehouseAPI.adminGetWarehouseVariants(),
      ]);

      const supList = supRes.data?.data || supRes.data?.items || (Array.isArray(supRes.data) ? supRes.data : []);
      setSuppliers(Array.isArray(supList) ? supList : []);

      const recList = recRes.data?.content || recRes.data?.data?.content || recRes.data?.data || (Array.isArray(recRes.data) ? recRes.data : []);
      setReceipts(Array.isArray(recList) ? recList : []);

      const varList = varRes.data?.data || varRes.data?.items || (Array.isArray(varRes.data) ? varRes.data : []);
      setVariants(Array.isArray(varList) ? varList : []);
    } catch {
      message.error("Lỗi khi tải dữ liệu kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // SUPPLIER ACTIONS
  const handleOpenSupplierModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      supplierForm.setFieldsValue(sup);
    } else {
      setEditingSupplier(null);
      supplierForm.resetFields();
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async () => {
    try {
      const values = await supplierForm.validateFields();
      if (editingSupplier) {
        await warehouseAPI.adminUpdateSupplier(editingSupplier.supplier_id, values);
        message.success("Cập nhật nhà cung cấp thành công");
      } else {
        await warehouseAPI.adminCreateSupplier(values);
        message.success("Thêm nhà cung cấp mới thành công");
      }
      setIsSupplierModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Lỗi lưu nhà cung cấp");
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      await warehouseAPI.adminDeleteSupplier(id);
      message.success("Đã ngừng hợp tác với nhà cung cấp");
      loadData();
    } catch {
      message.error("Lỗi khi xóa nhà cung cấp");
    }
  };

  // RECEIPT ACTIONS
  const handleOpenReceiptModal = () => {
    receiptForm.resetFields();
    const firstVar = variants[0];
    const initialPrice = firstVar ? Math.round((Number(firstVar.price) * 0.6) / 1000) * 1000 : 500000;
    setReceiptItems([{ variant_id: firstVar ? firstVar.variant_id : undefined, import_price: initialPrice, quantity: 20 }]);
    setIsReceiptModalOpen(true);
  };

  const handleQuickImport = (variantId: number) => {
    const foundVar = variants.find((v) => v.variant_id === variantId);
    const suggested = foundVar ? Math.round((Number(foundVar.price) * 0.6) / 1000) * 1000 : 500000;
    receiptForm.resetFields();
    setReceiptItems([{ variant_id: variantId, import_price: suggested, quantity: 20 }]);
    setIsReceiptModalOpen(true);
  };

  const handleAddReceiptItemRow = () => {
    const firstVar = variants[0];
    const initialPrice = firstVar ? Math.round((Number(firstVar.price) * 0.6) / 1000) * 1000 : 500000;
    setReceiptItems([...receiptItems, { variant_id: undefined, import_price: initialPrice, quantity: 10 }]);
  };

  const handleRemoveReceiptItemRow = (idx: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== idx));
  };

  const handleReceiptItemChange = (idx: number, field: string, val: any) => {
    const updated = [...receiptItems];
    updated[idx][field] = val;
    if (field === "variant_id") {
      const foundVar = variants.find((v) => v.variant_id === val);
      if (foundVar) {
        // Tự động gợi ý giá vốn nếu chưa chỉnh hoặc đang ở mặc định
        const suggested = Math.round((Number(foundVar.price) * 0.6) / 1000) * 1000;
        updated[idx].import_price = suggested > 0 ? suggested : 500000;
      }
    }
    setReceiptItems(updated);
  };

  const handleCreateReceipt = async () => {
    try {
      const values = await receiptForm.validateFields();
      const validItems = receiptItems.filter((it) => it.variant_id && it.quantity > 0);
      if (validItems.length === 0) {
        message.warning("Vui lòng chọn ít nhất một biến thể sản phẩm nhập kho");
        return;
      }

      await warehouseAPI.adminCreateReceipt({
        supplier_id: values.supplier_id,
        note: values.note,
        items: validItems,
      });

      message.success("Lập phiếu nhập kho thành công! Tồn kho đã được tự động cộng dồn.");
      setIsReceiptModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Lỗi lập phiếu nhập kho");
    }
  };

  const handleViewReceiptDetail = async (id: number) => {
    try {
      const res = await warehouseAPI.adminGetReceiptDetail(id);
      setSelectedReceipt(res.data);
      setIsDetailOpen(true);
    } catch {
      message.error("Lỗi xem chi tiết phiếu nhập");
    }
  };

  // Danh sách biến thể hiển thị trong Select Lập Phiếu
  const variantOptions = variants.map((v) => ({
    value: v.variant_id,
    label: `${v.product_name} - Màu: ${v.color} | Size: ${v.size} (SKU: ${v.sku} - Tồn: ${v.stock_quantity})`,
    searchText: `${v.product_name} ${v.color} ${v.size} ${v.sku}`.toLowerCase(),
  }));

  // Lọc biến thể cho Tab Tồn Kho
  const filteredVariants = variants.filter((v) => {
    if (!variantSearch) return true;
    const q = variantSearch.toLowerCase();
    return (
      (v.product_name && v.product_name.toLowerCase().includes(q)) ||
      (v.sku && v.sku.toLowerCase().includes(q)) ||
      (v.color && v.color.toLowerCase().includes(q)) ||
      (v.size && v.size.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Nhập Kho & Biến Thể Tồn Kho
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Quản lý quan hệ cung ứng, lập phiếu nhập hàng và tự động cập nhật số lượng tồn kho theo từng biến thể
          </span>
        </div>

        <Button
          type="primary"
          onClick={handleOpenReceiptModal}
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
          Lập Phiếu Nhập Kho Mới
        </Button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: 20 }}>
        <Tabs
          defaultActiveKey="receipts"
          items={[
            {
              key: "receipts",
              label: (
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  <InboxOutlined style={{ marginRight: 6 }} /> Danh Sách Phiếu Nhập Kho ({receipts.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={receipts}
                  rowKey="receipt_id"
                  loading={loading}
                  columns={[
                    {
                      title: "Mã phiếu",
                      dataIndex: "receipt_code",
                      key: "receipt_code",
                      render: (code) => <b>{code}</b>,
                    },
                    { title: "Nhà cung cấp", dataIndex: "supplier_name", key: "supplier_name" },
                    { title: "Người tạo", dataIndex: "creator_name", key: "creator_name" },
                    {
                      title: "Tổng chi phí nhập",
                      dataIndex: "total_cost",
                      key: "total_cost",
                      render: (v) => <b style={{ color: "#2563EB" }}>{formatPrice(v)}</b>,
                    },
                    {
                      title: "Ngày nhập",
                      dataIndex: "received_at",
                      key: "received_at",
                      render: (dt) => new Date(dt).toLocaleString("vi-VN"),
                    },
                    {
                      title: "Thao tác",
                      key: "action",
                      render: (_, rec) => (
                        <Button size="small" onClick={() => handleViewReceiptDetail(rec.receipt_id)}>
                          Xem Chi Tiết
                        </Button>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "variants",
              label: (
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  <AppstoreOutlined style={{ marginRight: 6 }} /> Tồn Kho Biến Thể ({variants.length})
                </span>
              ),
              children: (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <Input
                      placeholder="Tìm kiếm biến thể theo tên sản phẩm, SKU, màu sắc, size..."
                      prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
                      value={variantSearch}
                      onChange={(e) => setVariantSearch(e.target.value)}
                      style={{ maxWidth: 400, borderRadius: 0 }}
                      allowClear
                    />
                    <div style={{ fontSize: 13, color: "#71717A" }}>
                      Tổng số biến thể trong hệ thống: <b>{variants.length}</b>
                    </div>
                  </div>

                  <Table
                    dataSource={filteredVariants}
                    rowKey="variant_id"
                    loading={loading}
                    columns={[
                      {
                        title: "Sản phẩm",
                        key: "prod",
                        render: (_, v) => (
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {v.thumbnail ? (
                              <img src={v.thumbnail} alt={v.product_name} style={{ width: 42, height: 52, objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: 42, height: 52, background: "#F4F4F5" }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: "#18181B" }}>{v.product_name}</div>
                              <div style={{ fontSize: 12, color: "#71717A" }}>{v.category_name}</div>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Mã SKU",
                        dataIndex: "sku",
                        key: "sku",
                        render: (sku) => <Tag style={{ borderRadius: 0, fontWeight: 600 }}>{sku}</Tag>,
                      },
                      {
                        title: "Màu sắc",
                        dataIndex: "color",
                        key: "color",
                      },
                      {
                        title: "Kích cỡ",
                        dataIndex: "size",
                        key: "size",
                        render: (s) => <b>{s}</b>,
                      },
                      {
                        title: "Giá bán lẻ",
                        dataIndex: "price",
                        key: "price",
                        render: (p) => formatPrice(p),
                      },
                      {
                        title: "Tồn kho hiện tại",
                        dataIndex: "stock_quantity",
                        key: "stock_quantity",
                        render: (qty) => {
                          if (qty <= 0) return <Tag color="red" style={{ borderRadius: 0 }}>Hết hàng ({qty})</Tag>;
                          if (qty <= 15) return <Tag color="orange" style={{ borderRadius: 0 }}>Sắp hết ({qty})</Tag>;
                          return <Tag color="green" style={{ borderRadius: 0 }}>Còn hàng ({qty})</Tag>;
                        },
                      },
                      {
                        title: "Thao tác",
                        key: "act",
                        render: (_, v) => (
                          <Button
                            size="small"
                            type="dashed"
                            icon={<ArrowUpOutlined />}
                            onClick={() => handleQuickImport(v.variant_id)}
                            style={{ borderRadius: 0, color: "#2563EB", borderColor: "#93C5FD" }}>
                            Nhập Thêm
                          </Button>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: "suppliers",
              label: (
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  <ShopOutlined style={{ marginRight: 6 }} /> Danh Bạ Nhà Cung Cấp ({suppliers.length})
                </span>
              ),
              children: (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <Button onClick={() => handleOpenSupplierModal()} icon={<PlusOutlined />}>
                      Thêm Nhà Cung Cấp
                    </Button>
                  </div>
                  <Table
                    dataSource={suppliers}
                    rowKey="supplier_id"
                    columns={[
                      { title: "Tên nhà cung cấp", dataIndex: "name", key: "name", render: (n) => <b>{n}</b> },
                      { title: "Người liên hệ", dataIndex: "contact_name", key: "contact_name" },
                      { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
                      { title: "Email", dataIndex: "email", key: "email" },
                      { title: "Địa chỉ", dataIndex: "address", key: "address" },
                      {
                        title: "Trạng thái",
                        dataIndex: "is_active",
                        key: "is_active",
                        render: (act) => <Tag color={act ? "green" : "red"}>{act ? "Đang hợp tác" : "Ngừng"}</Tag>,
                      },
                      {
                        title: "Thao tác",
                        key: "action",
                        render: (_, sup) => (
                          <Space>
                            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenSupplierModal(sup)} />
                            <Popconfirm
                              title="Ngừng hợp tác với nhà cung cấp này?"
                              onConfirm={() => handleDeleteSupplier(sup.supplier_id)}
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
              ),
            },
          ]}
        />
      </div>

      {/* Modal Lập Phiếu Nhập Kho */}
      <Modal
        title={<span style={{ fontFamily: "serif", fontSize: 20 }}>Lập Phiếu Nhập Kho (Tự Động Cộng Tồn Kho)</span>}
        open={isReceiptModalOpen}
        onCancel={() => setIsReceiptModalOpen(false)}
        onOk={handleCreateReceipt}
        okText="Xác Nhận Nhập Hàng"
        cancelText="Hủy"
        width={850}>
        <Form form={receiptForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Chọn Nhà Cung Cấp" name="supplier_id" rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp" }]}>
                <Select placeholder="Chọn nhà cung cấp">
                  {(Array.isArray(suppliers) ? suppliers : []).map((s) => (
                    <Select.Option key={s.supplier_id} value={s.supplier_id}>
                      {s.name} ({s.phone})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ghi chú phiếu nhập" name="note">
                <Input placeholder="Lô hàng nhập đầu mùa, bổ sung tồn kho..." />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ borderTop: "1px solid #E4E4E7", paddingTop: 16, marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <b>Danh Sách Mặt Hàng / Biến Thể Nhập Kho ({receiptItems.length}):</b>
              <Button size="small" onClick={handleAddReceiptItemRow} icon={<PlusOutlined />}>
                Thêm Dòng
              </Button>
            </div>

            {variants.length === 0 ? (
              <Empty description="Chưa có dữ liệu biến thể sản phẩm trong kho" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(Array.isArray(receiptItems) ? receiptItems : []).map((it, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", background: "#FAFAF9", border: "1px solid #EAEAE8", padding: 8 }}>
                    <Select
                      showSearch
                      filterOption={(input, option) => {
                        const opt = variantOptions.find((o) => o.value === option?.value);
                        return opt ? opt.searchText.includes(input.toLowerCase()) : false;
                      }}
                      placeholder="Tìm kiếm và chọn biến thể sản phẩm..."
                      style={{ flex: 1 }}
                      value={it.variant_id}
                      onChange={(val) => handleReceiptItemChange(idx, "variant_id", val)}
                      options={variantOptions}
                    />

                    <Tooltip title="Đơn giá nhập vốn">
                      <InputNumber
                        placeholder="Đơn giá nhập"
                        value={it.import_price}
                        onChange={(val) => handleReceiptItemChange(idx, "import_price", val)}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, "")) : 0)}
                        style={{ width: 140 }}
                      />
                    </Tooltip>

                    <Tooltip title="Số lượng nhập kho">
                      <InputNumber
                        placeholder="Số lượng"
                        min={1}
                        value={it.quantity}
                        onChange={(val) => handleReceiptItemChange(idx, "quantity", val)}
                        style={{ width: 90 }}
                      />
                    </Tooltip>

                    <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveReceiptItemRow(idx)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form>
      </Modal>

      {/* Modal Chi Tiết Phiếu Nhập */}
      <Modal
        title={<span style={{ fontFamily: "serif", fontSize: 20 }}>Chi Tiết Phiếu Nhập #{selectedReceipt?.receipt_code}</span>}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={null}
        width={700}>
        {selectedReceipt && (
          <div style={{ padding: "12px 0" }}>
            <div style={{ background: "#FAFAF9", border: "1px solid #EAEAE8", padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.8 }}>
              <div><b>Nhà cung cấp:</b> {selectedReceipt.supplier_name} ({selectedReceipt.supplier_phone})</div>
              <div><b>Người lập phiếu:</b> {selectedReceipt.creator_name}</div>
              <div><b>Thời gian:</b> {new Date(selectedReceipt.received_at).toLocaleString("vi-VN")}</div>
              {selectedReceipt.note && <div><b>Ghi chú:</b> {selectedReceipt.note}</div>}
            </div>

            <Table
              dataSource={selectedReceipt.items}
              rowKey="receipt_item_id"
              pagination={false}
              columns={[
                { title: "Sản phẩm", dataIndex: "product_name", key: "product_name" },
                { title: "SKU", dataIndex: "sku", key: "sku" },
                { title: "Màu / Size", key: "var", render: (_: any, r: any) => `${r?.color || ""} / ${r?.size || ""}` },
                { title: "Giá nhập", dataIndex: "import_price", key: "import_price", render: (v: any) => formatPrice(v) },
                { title: "Số lượng", dataIndex: "quantity", key: "quantity", render: (q: any) => <b>+{q}</b> },
              ]}
            />

            <div style={{ marginTop: 16, textAlign: "right", fontSize: 16, fontWeight: 700 }}>
              Tổng tiền vốn nhập: {formatPrice(selectedReceipt.total_cost)}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm / Sửa Nhà Cung Cấp */}
      <Modal
        title={<span style={{ fontFamily: "serif", fontSize: 20 }}>{editingSupplier ? "Chỉnh Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp Mới"}</span>}
        open={isSupplierModalOpen}
        onCancel={() => setIsSupplierModalOpen(false)}
        onOk={handleSaveSupplier}
        okText="Lưu"
        cancelText="Hủy">
        <Form form={supplierForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Tên nhà cung cấp" name="name" rules={[{ required: true, message: "Vui lòng nhập tên nhà cung cấp" }]}>
            <Input placeholder="Công ty Dệt May Châu Âu..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Người liên hệ" name="contact_name">
                <Input placeholder="Nguyễn Văn An" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}>
                <Input placeholder="0988776655" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Email" name="email">
            <Input placeholder="nhacungcap@gmail.com" />
          </Form.Item>
          <Form.Item label="Địa chỉ" name="address">
            <Input placeholder="123 Phố Huế, Hai Bà Trưng, Hà Nội" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
