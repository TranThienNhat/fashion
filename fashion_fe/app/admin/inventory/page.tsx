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
  Divider,
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
  PlusCircleOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import { warehouseAPI, catalogAPI, getApiMessage, getApiError } from "@/lib/api";
import { formatPrice } from "@/lib/constants";
import type { Supplier, PurchaseReceipt, WarehouseVariant, Category, Brand } from "@/lib/types";
import ImageUploader from "@/components/ImageUploader";

export default function AdminInventoryPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [variants, setVariants] = useState<WarehouseVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
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
    { variant_id: undefined, import_price: undefined, quantity: 20 },
  ]);

  // Quick Product modal from Receipt
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [quickProductLoading, setQuickProductLoading] = useState(false);
  const [quickProductForm] = Form.useForm();
  const [quickThumbnail, setQuickThumbnail] = useState<string>("");
  const [targetItemIndex, setTargetItemIndex] = useState<number | null>(null);

  // Detail modal
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [supRes, recRes, varRes, catRes, brdRes] = await Promise.all([
        warehouseAPI.adminGetSuppliers(),
        warehouseAPI.adminGetReceipts({ page: 0, size: 50 }),
        warehouseAPI.adminGetWarehouseVariants(),
        catalogAPI.getCategories(),
        catalogAPI.getBrands(),
      ]);

      const supList = supRes.data?.data || supRes.data?.items || (Array.isArray(supRes.data) ? supRes.data : []);
      setSuppliers(Array.isArray(supList) ? supList : []);

      const recList = recRes.data?.content || recRes.data?.data?.content || recRes.data?.data || (Array.isArray(recRes.data) ? recRes.data : []);
      setReceipts(Array.isArray(recList) ? recList : []);

      const varList = varRes.data?.data || varRes.data?.items || (Array.isArray(varRes.data) ? varRes.data : []);
      setVariants(Array.isArray(varList) ? varList : []);

      const catList = catRes.data?.data || (Array.isArray(catRes.data) ? catRes.data : []);
      setCategories(Array.isArray(catList) ? catList : []);

      const brdList = brdRes.data?.data || (Array.isArray(brdRes.data) ? brdRes.data : []);
      setBrands(Array.isArray(brdList) ? brdList : []);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tải dữ liệu kho hàng. Vui lòng thử lại sau."));
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
        const res = await warehouseAPI.adminUpdateSupplier(editingSupplier.supplier_id, values);
        message.success(getApiMessage(res, "Cập nhật đối tác cung ứng thành công."));
      } else {
        const res = await warehouseAPI.adminCreateSupplier(values);
        message.success(getApiMessage(res, "Thêm đối tác cung ứng mới thành công."));
      }
      setIsSupplierModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể lưu đối tác cung ứng. Vui lòng kiểm tra lại thông tin."));
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      const res = await warehouseAPI.adminDeleteSupplier(id);
      message.success(getApiMessage(res, "Đã cập nhật trạng thái ngừng hợp tác với nhà cung cấp."));
      loadData();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể thao tác với đối tác cung ứng. Vui lòng thử lại."));
    }
  };

  // QUICK PRODUCT ACTIONS (TẠO SẢN PHẨM MỚI KÈM BIẾN THỂ MẶC ĐỊNH NGAY TRÊN PHIẾU NHẬP)
  const handleOpenQuickProductModal = (rowIdx?: number) => {
    setTargetItemIndex(rowIdx !== undefined ? rowIdx : null);
    quickProductForm.resetFields();
    setQuickThumbnail("");
    quickProductForm.setFieldsValue({
      color: "Tiêu chuẩn",
      size: "Freesize",
    });
    setIsQuickProductModalOpen(true);
  };

  const handleCreateQuickProduct = async () => {
    try {
      setQuickProductLoading(true);
      const values = await quickProductForm.validateFields();
      const payload = {
        name: values.name.trim(),
        category_id: values.category_id,
        brand_id: values.brand_id || null,
        base_price: values.base_price,
        description: values.description || "",
        thumbnail: quickThumbnail || "",
        color: values.color?.trim() || "Tiêu chuẩn",
        size: values.size?.trim() || "Freesize",
        sku: values.sku?.trim() || "",
        has_variants: true,
        stock_quantity: 0,
        variants: [
          {
            sku: values.sku?.trim() || "",
            color: values.color?.trim() || "Tiêu chuẩn",
            size: values.size?.trim() || "Freesize",
            price: values.base_price,
            stock_quantity: 0,
          },
        ],
      };

      const res = await catalogAPI.adminCreateProduct(payload);
      const createdVariantId = res.data?.data?.variant_id || res.data?.variant_id;

      // Cập nhật lại danh sách biến thể trong kho
      const varRes = await warehouseAPI.adminGetWarehouseVariants();
      const varList = varRes.data?.data || varRes.data?.items || (Array.isArray(varRes.data) ? varRes.data : []);
      setVariants(Array.isArray(varList) ? varList : []);

      // Tự động gán biến thể mới vào dòng phiếu nhập
      if (createdVariantId) {
        if (targetItemIndex !== null && receiptItems[targetItemIndex]) {
          const updated = [...receiptItems];
          updated[targetItemIndex] = {
            ...updated[targetItemIndex],
            variant_id: createdVariantId,
          };
          setReceiptItems(updated);
        } else {
          const lastIdx = receiptItems.length - 1;
          if (lastIdx >= 0 && !receiptItems[lastIdx].variant_id) {
            const updated = [...receiptItems];
            updated[lastIdx].variant_id = createdVariantId;
            setReceiptItems(updated);
          } else {
            setReceiptItems([
              ...receiptItems,
              { variant_id: createdVariantId, import_price: undefined, quantity: 20 },
            ]);
          }
        }
      }

      message.success("Đã thêm sản phẩm mới và gán vào phiếu nhập kho thành công!");
      setIsQuickProductModalOpen(false);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tạo sản phẩm mới. Vui lòng kiểm tra lại thông tin."));
    } finally {
      setQuickProductLoading(false);
    }
  };

  // RECEIPT ACTIONS
  const handleOpenReceiptModal = () => {
    receiptForm.resetFields();
    setReceiptItems([{ variant_id: undefined, import_price: undefined, quantity: 20 }]);
    setIsReceiptModalOpen(true);
  };

  const handleQuickImport = (variantId: number) => {
    receiptForm.resetFields();
    setReceiptItems([{ variant_id: variantId, import_price: undefined, quantity: 20 }]);
    setIsReceiptModalOpen(true);
  };

  const handleAddReceiptItemRow = () => {
    setReceiptItems([...receiptItems, { variant_id: undefined, import_price: undefined, quantity: 10 }]);
  };

  const handleRemoveReceiptItemRow = (idx: number) => {
    setReceiptItems(receiptItems.filter((_, i) => i !== idx));
  };

  const handleReceiptItemChange = (idx: number, field: string, val: any) => {
    const updated = [...receiptItems];
    updated[idx][field] = val;
    setReceiptItems(updated);
  };

  const handleCreateReceipt = async () => {
    try {
      const values = await receiptForm.validateFields();
      const validItems = receiptItems.filter((it) => it.variant_id && it.quantity > 0);
      if (validItems.length === 0) {
        message.warning("Vui lòng chọn ít nhất một biến thể sản phẩm hợp lệ để lập phiếu nhập.");
        return;
      }

      // Kiểm tra xem có dòng nào chưa nhập đơn giá vốn không
      const missingPriceItem = validItems.find((it) => it.import_price === undefined || it.import_price === null || it.import_price === "" || Number(it.import_price) < 0);
      if (missingPriceItem) {
        message.warning("Vui lòng nhập đầy đủ đơn giá nhập vốn cho từng mặt hàng trong phiếu.");
        return;
      }

      const res = await warehouseAPI.adminCreateReceipt({
        supplier_id: values.supplier_id,
        note: values.note,
        items: validItems,
      });

      message.success(getApiMessage(res, "Lập phiếu nhập kho thành công! Số lượng tồn kho đã được cập nhật chính xác."));
      setIsReceiptModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể lập phiếu nhập kho. Vui lòng kiểm tra lại thông tin."));
    }
  };

  const handleViewReceiptDetail = async (id: number) => {
    try {
      const res = await warehouseAPI.adminGetReceiptDetail(id);
      setSelectedReceipt(res.data);
      setIsDetailOpen(true);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tải chi tiết chứng từ nhập kho."));
    }
  };

  // Danh sách biến thể hiển thị trong Select Lập Phiếu
  const variantOptions = variants.map((v) => {
    const rawName = (v.product_name || "Sản phẩm").trim();
    // Cắt ngắn tên sản phẩm nếu dài quá để không bị tràn vỡ ô, kèm dấu ...
    const shortName = rawName.length > 32 ? rawName.slice(0, 32) + "..." : rawName;
    const hasSize = v.size && v.size.trim() !== "" && v.size !== "Tiêu chuẩn";
    const colorPart = v.color ? `Màu: ${v.color}` : "";
    const sizePart = hasSize ? `Size: ${v.size}` : "";
    const spec = [colorPart, sizePart].filter(Boolean).join(" | ");

    return {
      value: v.variant_id,
      label: `${shortName}${spec ? ` — [${spec}]` : ""} (Tồn: ${v.stock_quantity})`,
      title: `${rawName}${spec ? ` - ${spec}` : ""} (SKU: ${v.sku} - Tồn kho: ${v.stock_quantity})`,
      searchText: `${rawName} ${v.color || ""} ${v.size || ""} ${v.sku || ""}`.toLowerCase(),
    };
  });

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
                      width: 140,
                      render: (code) => <b>{code}</b>,
                    },
                    {
                      title: "Nhà cung cấp",
                      dataIndex: "supplier_name",
                      key: "supplier_name",
                      ellipsis: true,
                      render: (name) => (
                        <Tooltip title={name}>
                          <span style={{ display: "inline-block", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {name || "—"}
                          </span>
                        </Tooltip>
                      ),
                    },
                    {
                      title: "Người tạo",
                      dataIndex: "creator_name",
                      key: "creator_name",
                      ellipsis: true,
                      render: (name) => (
                        <Tooltip title={name}>
                          <span style={{ display: "inline-block", maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {name || "—"}
                          </span>
                        </Tooltip>
                      ),
                    },
                    {
                      title: "Tổng chi phí nhập",
                      dataIndex: "total_cost",
                      key: "total_cost",
                      width: 160,
                      render: (v) => <b style={{ color: "#2563EB" }}>{formatPrice(v)}</b>,
                    },
                    {
                      title: "Ngày nhập",
                      dataIndex: "received_at",
                      key: "received_at",
                      width: 170,
                      render: (dt) => new Date(dt).toLocaleString("vi-VN"),
                    },
                    {
                      title: "Thao tác",
                      key: "action",
                      width: 120,
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
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            {v.thumbnail ? (
                              <img src={v.thumbnail} alt={v.product_name} style={{ width: 42, height: 52, objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 42, height: 52, background: "#F4F4F5", flexShrink: 0 }} />
                            )}
                            <div style={{ minWidth: 0, overflow: "hidden" }}>
                              <Tooltip title={v.product_name}>
                                <div style={{ fontWeight: 600, color: "#18181B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
                                  {v.product_name}
                                </div>
                              </Tooltip>
                              <Tooltip title={v.category_name}>
                                <div style={{ fontSize: 12, color: "#71717A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                                  {v.category_name}
                                </div>
                              </Tooltip>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Mã SKU",
                        dataIndex: "sku",
                        key: "sku",
                        render: (sku) => (
                          <Tooltip title={sku}>
                            <Tag style={{ borderRadius: 0, fontWeight: 600, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                              {sku}
                            </Tag>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "Màu sắc",
                        dataIndex: "color",
                        key: "color",
                        ellipsis: true,
                        render: (c) => (
                          <Tooltip title={c}>
                            <span style={{ display: "inline-block", maxWidth: 110, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {c}
                            </span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "Kích cỡ",
                        dataIndex: "size",
                        key: "size",
                        width: 90,
                        ellipsis: true,
                        render: (s) => (
                          <Tooltip title={s && s !== "Tiêu chuẩn" ? s : "Không có size"}>
                            <b style={{ display: "inline-block", maxWidth: 80, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {s && s !== "Tiêu chuẩn" ? s : <span style={{ color: "#9CA3AF", fontWeight: 400 }}>—</span>}
                            </b>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "Giá bán lẻ",
                        dataIndex: "price",
                        key: "price",
                        width: 130,
                        render: (p) => formatPrice(p),
                      },
                      {
                        title: "Tồn kho hiện tại",
                        dataIndex: "stock_quantity",
                        key: "stock_quantity",
                        width: 140,
                        render: (qty) => {
                          if (qty <= 0) return <Tag color="red" style={{ borderRadius: 0 }}>Hết hàng ({qty})</Tag>;
                          if (qty <= 15) return <Tag color="orange" style={{ borderRadius: 0 }}>Sắp hết ({qty})</Tag>;
                          return <Tag color="green" style={{ borderRadius: 0 }}>Còn hàng ({qty})</Tag>;
                        },
                      },
                      {
                        title: "Thao tác",
                        key: "act",
                        width: 120,
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
                      {
                        title: "Tên nhà cung cấp",
                        dataIndex: "name",
                        key: "name",
                        ellipsis: true,
                        render: (n) => (
                          <Tooltip title={n}>
                            <b style={{ display: "inline-block", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {n}
                            </b>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "Người liên hệ",
                        dataIndex: "contact_name",
                        key: "contact_name",
                        ellipsis: true,
                        render: (cn) => (
                          <Tooltip title={cn}>
                            <span style={{ display: "inline-block", maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {cn || "—"}
                            </span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "Số điện thoại",
                        dataIndex: "phone",
                        key: "phone",
                        width: 130,
                        render: (p) => p || "—",
                      },
                      {
                        title: "Email",
                        dataIndex: "email",
                        key: "email",
                        ellipsis: true,
                        render: (em) => (
                          <Tooltip title={em}>
                            <span style={{ display: "inline-block", maxWidth: 170, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {em || "—"}
                            </span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "Địa chỉ",
                        dataIndex: "address",
                        key: "address",
                        ellipsis: true,
                        render: (addr) => (
                          <Tooltip title={addr}>
                            <span style={{ display: "inline-block", maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {addr || "—"}
                            </span>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "is_active",
                        key: "is_active",
                        width: 120,
                        render: (act) => <Tag color={act ? "green" : "red"}>{act ? "Đang hợp tác" : "Ngừng"}</Tag>,
                      },
                      {
                        title: "Thao tác",
                        key: "action",
                        width: 100,
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
        width={880}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <b>Danh Sách Mặt Hàng / Biến Thể Nhập Kho ({receiptItems.length}):</b>
              <Space>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusCircleOutlined />}
                  onClick={() => handleOpenQuickProductModal()}
                  style={{ borderRadius: 0, borderColor: "#0D0D0D", color: "#0D0D0D", fontWeight: 500 }}>
                  + Thêm Sản Phẩm Mới (Chưa Có Trong Kho)
                </Button>
                <Button size="small" onClick={handleAddReceiptItemRow} icon={<PlusOutlined />} style={{ borderRadius: 0 }}>
                  Thêm Dòng
                </Button>
              </Space>
            </div>

            {variants.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", background: "#FAFAF9", border: "1px dashed #D4D4D8" }}>
                <Empty description="Chưa có dữ liệu biến thể sản phẩm nào trong kho">
                  <Button
                    type="primary"
                    icon={<PlusCircleOutlined />}
                    onClick={() => handleOpenQuickProductModal()}
                    style={{ borderRadius: 0, background: "#0D0D0D" }}>
                    Thêm Sản Phẩm Đầu Tiên Để Nhập Kho
                  </Button>
                </Empty>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(Array.isArray(receiptItems) ? receiptItems : []).map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      background: "#FAFAF9",
                      border: "1px solid #EAEAE8",
                      padding: "8px 12px",
                      borderRadius: 0,
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Select
                        showSearch
                        filterOption={(input, option) => {
                          const opt = variantOptions.find((o) => o.value === option?.value);
                          return opt ? opt.searchText.includes(input.toLowerCase()) : false;
                        }}
                        placeholder="Tìm kiếm và chọn biến thể sản phẩm..."
                        style={{ width: "100%", borderRadius: 0 }}
                        value={it.variant_id}
                        onChange={(val) => handleReceiptItemChange(idx, "variant_id", val)}
                        options={variantOptions}
                        dropdownRender={(menu) => (
                          <>
                            {menu}
                            <Divider style={{ margin: "4px 0" }} />
                            <div style={{ padding: "6px 12px" }}>
                              <Button
                                type="link"
                                size="small"
                                icon={<AppstoreAddOutlined />}
                                onClick={() => handleOpenQuickProductModal(idx)}
                                style={{ padding: 0, color: "#0D0D0D", fontWeight: 600 }}>
                                + Thêm sản phẩm chưa có trong danh mục
                              </Button>
                            </div>
                          </>
                        )}
                      />
                    </div>

                    <Tooltip title="Đơn giá nhập vốn (VNĐ)">
                      <InputNumber
                        placeholder="Nhập giá vốn..."
                        min={0}
                        value={it.import_price}
                        onChange={(val) => handleReceiptItemChange(idx, "import_price", val)}
                        formatter={(value) => (value !== undefined && value !== null && value !== "" ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                        parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, "")) : (undefined as any))}
                        style={{ width: 140, flexShrink: 0, borderRadius: 0 }}
                      />
                    </Tooltip>

                    <Tooltip title="Số lượng nhập kho">
                      <InputNumber
                        placeholder="Số lượng"
                        min={1}
                        value={it.quantity}
                        onChange={(val) => handleReceiptItemChange(idx, "quantity", val)}
                        style={{ width: 95, flexShrink: 0, borderRadius: 0 }}
                      />
                    </Tooltip>

                    <Tooltip title="Xóa dòng">
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveReceiptItemRow(idx)}
                        style={{ flexShrink: 0, borderRadius: 0 }}
                      />
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form>
      </Modal>

      {/* Modal Thêm Nhanh Sản Phẩm Mới & Biến Thể Mặc Định Trực Tiếp Từ Phiếu Nhập */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AppstoreAddOutlined style={{ fontSize: 20, color: "#0D0D0D" }} />
            <span style={{ fontFamily: "serif", fontSize: 20, fontWeight: 600 }}>
              Thêm Nhanh Sản Phẩm Mới & Biến Thể Mặc Định
            </span>
          </div>
        }
        open={isQuickProductModalOpen}
        onCancel={() => setIsQuickProductModalOpen(false)}
        onOk={handleCreateQuickProduct}
        okText="Tạo Sản Phẩm & Gán Vào Phiếu"
        cancelText="Hủy Bỏ"
        width={720}
        confirmLoading={quickProductLoading}
        style={{ top: 30 }}
        styles={{
          mask: { backdropFilter: "blur(4px)" },
        }}>
        <div style={{ marginBottom: 12, fontSize: 13, color: "#666" }}>
          Sản phẩm và biến thể mặc định sẽ được tạo mới và tự động chọn vào phiếu nhập kho hiện tại để bạn nhập giá vốn và số lượng ngay lập tức.
        </div>
        <Form form={quickProductForm} layout="vertical">
          <Form.Item
            label="Tên sản phẩm"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm mới" }]}>
            <Input placeholder="VD: Áo Sơ Mi Lụa Cổ Trụ ÉLÉGANCE..." style={{ borderRadius: 0 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Danh mục sản phẩm"
                name="category_id"
                rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}>
                <Select
                  placeholder="Chọn danh mục"
                  style={{ borderRadius: 0 }}
                  options={categories.map((c) => ({ value: c.category_id, label: c.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thương hiệu" name="brand_id">
                <Select
                  placeholder="Chọn thương hiệu (nếu có)"
                  allowClear
                  style={{ borderRadius: 0 }}
                  options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Giá bán niêm yết (VNĐ)"
                name="base_price"
                rules={[{ required: true, message: "Vui lòng nhập giá bán niêm yết" }]}>
                <InputNumber
                  min={0}
                  placeholder="VD: 1,850,000"
                  style={{ width: "100%", borderRadius: 0 }}
                  formatter={(val) => (val ? `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
                  parser={(val) => (val ? Number(val.replace(/\$\s?|(,*)/g, "")) : (undefined as any))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mã SKU (tự sinh nếu để trống)" name="sku">
                <Input placeholder="VD: ASM-LUA-BLK-STD" style={{ borderRadius: 0 }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: "12px 0 16px 0", fontSize: 13, fontWeight: 600 }}>
            Biến Thể Mặc Định Ban Đầu
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Màu sắc biến thể"
                name="color"
                rules={[{ required: true, message: "Vui lòng nhập màu sắc" }]}>
                <Input placeholder="VD: Đen Tuyền, Trắng Ngọc Trai, Tiêu chuẩn..." style={{ borderRadius: 0 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Kích cỡ (Size)"
                name="size"
                rules={[{ required: true, message: "Vui lòng chọn kích cỡ" }]}>
                <Select
                  placeholder="Chọn size"
                  style={{ borderRadius: 0 }}
                  options={[
                    { value: "Freesize", label: "Freesize (Một cỡ chung)" },
                    { value: "S", label: "Size S (Nhỏ)" },
                    { value: "M", label: "Size M (Vừa)" },
                    { value: "L", label: "Size L (Lớn)" },
                    { value: "XL", label: "Size XL (Rất lớn)" },
                    { value: "XXL", label: "Size XXL" },
                    { value: "Tiêu chuẩn", label: "Tiêu chuẩn (Phụ kiện/Khác)" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ảnh sản phẩm">
                <ImageUploader
                  value={quickThumbnail}
                  onChange={setQuickThumbnail}
                  aspectRatio="3/4"
                  placeholderText="Tải lên ảnh mẫu sản phẩm (3:4)"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mô tả sản phẩm" name="description">
                <Input.TextArea
                  rows={5}
                  placeholder="Mô tả chất liệu, thiết kế, điểm nổi bật..."
                  style={{ borderRadius: 0 }}
                />
              </Form.Item>
            </Col>
          </Row>
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
                {
                  title: "Sản phẩm",
                  dataIndex: "product_name",
                  key: "product_name",
                  ellipsis: true,
                  render: (pn: string) => (
                    <Tooltip title={pn}>
                      <span style={{ display: "inline-block", maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {pn}
                      </span>
                    </Tooltip>
                  ),
                },
                {
                  title: "SKU",
                  dataIndex: "sku",
                  key: "sku",
                  width: 140,
                  ellipsis: true,
                  render: (sku: string) => (
                    <Tooltip title={sku}>
                      <span style={{ display: "inline-block", maxWidth: 130, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sku}
                      </span>
                    </Tooltip>
                  ),
                },
                {
                  title: "Màu / Size",
                  key: "var",
                  width: 130,
                  render: (_: any, r: any) => {
                    const hasSize = r?.size && r.size !== "Tiêu chuẩn";
                    if (r?.color && hasSize) return `${r.color} / ${r.size}`;
                    return r?.color || (hasSize ? r.size : "—");
                  },
                },
                { title: "Giá nhập", dataIndex: "import_price", key: "import_price", width: 130, render: (v: any) => formatPrice(v) },
                { title: "Số lượng", dataIndex: "quantity", key: "quantity", width: 90, render: (q: any) => <b>+{q}</b> },
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
