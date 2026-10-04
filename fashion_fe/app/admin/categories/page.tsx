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
  Tooltip,
  Switch,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  FolderFilled,
  QuestionCircleOutlined,
  LockOutlined,
  ApartmentOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  NodeIndexOutlined,
  BranchesOutlined,
  GlobalOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { catalogAPI } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "ROOT" | "SUB">("ALL");
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await catalogAPI.getCategories();
      const list = res.data?.flat || res.data?.data?.flat || (Array.isArray(res.data) ? res.data : []);
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      message.error("Lỗi khi tải cây danh mục sản phẩm");
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
        is_active: cat.is_active ?? true,
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleAddChildCategory = (parentCat: Category) => {
    setEditingCategory(null);
    form.resetFields();
    form.setFieldsValue({
      parent_id: parentCat.category_id,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const isCurrentlyRoot = editingCategory && !editingCategory.parent_id;
      const childCount = editingCategory
        ? categories.filter((c) => c.parent_id === editingCategory.category_id).length
        : 0;

      // Bảo vệ: Nếu là nốt root hoặc đang có con, luôn giữ parent_id là null
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
      message.success("Đã ẩn danh mục thành công");
      fetchCategories();
    } catch {
      message.error("Lỗi khi xóa danh mục");
    }
  };

  // Các danh mục gốc khả dụng làm cha
  const rootCategories = categories.filter((c) => !c.parent_id);
  const subCategories = categories.filter((c) => !!c.parent_id);
  const activeCount = categories.filter((c) => c.is_active).length;

  // Xác định nốt đang sửa có phải là root node hay không
  const isEditingRoot = editingCategory && !editingCategory.parent_id;
  const childCategories = editingCategory
    ? categories.filter((c) => c.parent_id === editingCategory.category_id)
    : [];
  const isLockedAsRoot = isEditingRoot || childCategories.length > 0;

  // Lọc dữ liệu hiển thị trên bảng
  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.parent_name && c.parent_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterLevel === "ROOT") return !c.parent_id;
    if (filterLevel === "SUB") return !!c.parent_id;
    return true;
  });

  return (
    <div>
      {/* Header chính */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Cây Danh Mục Sản Phẩm
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Cấu trúc phân tầng thời trang chuẩn mực: Danh mục Cấp Gốc (Root) điều hướng Header & Danh mục Cấp Con (Sub-Categories)
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

      {/* KPI Thống kê chuyên nghiệp */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tổng Danh Mục
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0D0D0D", marginTop: 4 }}>
              {categories.length}
            </div>
            <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>Trong toàn hệ thống</div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
              <FolderFilled style={{ color: "#D97706" }} /> Cấp Gốc (Root)
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#92400E", marginTop: 4 }}>
              {rootCategories.length}
            </div>
            <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>Điều hướng chính trên Header</div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
              <BranchesOutlined style={{ color: "#2563EB" }} /> Nhánh Con (Sub)
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#1E40AF", marginTop: 4 }}>
              {subCategories.length}
            </div>
            <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>Phân loại sản phẩm chuyên sâu</div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
              <GlobalOutlined style={{ color: "#16A34A" }} /> Đang Hoạt Động
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#15803D", marginTop: 4 }}>
              {activeCount} / {categories.length}
            </div>
            <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 2 }}>Hiển thị trên gian hàng</div>
          </div>
        </Col>
      </Row>

      {/* Bảng Danh Sách Danh Mục */}
      <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: 20 }}>
        {/* Bộ lọc và Tìm kiếm */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <Input
            placeholder="Tìm kiếm danh mục theo tên, slug, hoặc danh mục cha..."
            prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 380, borderRadius: 0 }}
            allowClear
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#71717A" }}>Lọc cấp độ:</span>
            <Select
              value={filterLevel}
              onChange={(val) => setFilterLevel(val)}
              style={{ width: 170, borderRadius: 0 }}
              options={[
                { value: "ALL", label: "Tất cả cấp bậc" },
                { value: "ROOT", label: "📁 Chỉ Cấp Gốc (Root)" },
                { value: "SUB", label: "↳ Chỉ Nhánh Con (Sub)" },
              ]}
            />
          </div>
        </div>

        <Table
          dataSource={filteredCategories}
          rowKey="category_id"
          loading={loading}
          pagination={false}
          columns={[
            {
              title: "Danh mục thời trang",
              dataIndex: "name",
              key: "name",
              render: (name, rec) => {
                const isRoot = !rec.parent_id;
                const subs = categories.filter((c) => c.parent_id === rec.category_id);
                return (
                  <div style={{ paddingLeft: isRoot ? 0 : 28, display: "flex", alignItems: "center", gap: 8 }}>
                    {isRoot ? (
                      <FolderFilled style={{ color: "#C5A880", fontSize: 17 }} />
                    ) : (
                      <span style={{ color: "#A1A1AA", fontSize: 13, fontWeight: 600 }}>└─</span>
                    )}
                    <span style={{ fontWeight: isRoot ? 700 : 500, fontSize: isRoot ? 14 : 13, color: isRoot ? "#0D0D0D" : "#3F3F46" }}>
                      {name}
                    </span>
                    {isRoot && subs.length > 0 && (
                      <Tag color="blue" style={{ borderRadius: 0, fontSize: 11, margin: 0, border: "none" }}>
                        {subs.length} nhánh con
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
              render: (slug) => (
                <span
                  style={{
                    fontFamily: "monospace",
                    background: "#F4F4F5",
                    padding: "3px 8px",
                    fontSize: 12,
                    color: "#52525B",
                  }}>
                  /{slug}
                </span>
              ),
            },
            {
              title: "Phân cấp trực thuộc",
              dataIndex: "parent_name",
              key: "parent_name",
              render: (p, rec) =>
                rec.parent_id ? (
                  <Tag style={{ borderRadius: 0, background: "#F4F4F5", color: "#3F3F46", border: "1px solid #E4E4E7" }}>
                    ↳ Thuộc: <b>{p}</b>
                  </Tag>
                ) : (
                  <Tag color="gold" style={{ borderRadius: 0, fontWeight: 700, letterSpacing: "0.02em" }}>
                    📁 CẤP GỐC (ROOT)
                  </Tag>
                ),
            },
            {
              title: "Trạng thái",
              dataIndex: "is_active",
              key: "is_active",
              render: (act) =>
                act ? (
                  <Tag color="green" style={{ borderRadius: 0, border: "none" }}>
                    ● Đang hiển thị
                  </Tag>
                ) : (
                  <Tag style={{ borderRadius: 0, color: "#71717A", background: "#F4F4F5", border: "none" }}>
                    ○ Đang ẩn
                  </Tag>
                ),
            },
            {
              title: "Thao tác",
              key: "action",
              render: (_, rec) => {
                const isRoot = !rec.parent_id;
                return (
                  <Space>
                    <Tooltip title="Chỉnh sửa thông tin danh mục">
                      <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(rec)} />
                    </Tooltip>

                    {isRoot && (
                      <Tooltip title="Tạo nhanh một danh mục con thuộc danh mục gốc này">
                        <Button
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddChildCategory(rec)}
                          style={{ borderRadius: 0, color: "#2563EB", borderColor: "#93C5FD", fontSize: 11 }}>
                          Thêm con
                        </Button>
                      </Tooltip>
                    )}

                    <Popconfirm
                      title="Ẩn danh mục này?"
                      description="Danh mục sẽ không còn xuất hiện trên thanh menu và bộ lọc sản phẩm."
                      onConfirm={() => handleDelete(rec.category_id)}
                      okText="Ẩn"
                      cancelText="Hủy">
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                );
              },
            },
          ]}
        />
      </div>

      {/* Modal Chỉnh Sửa / Thêm Danh Mục */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 6 }}>
            <ApartmentOutlined style={{ fontSize: 20, color: "#C5A880" }} />
            <div>
              <div style={{ fontFamily: "serif", fontSize: 20, color: "#0D0D0D" }}>
                {editingCategory ? `Chỉnh Sửa: ${editingCategory.name}` : "Thêm Danh Mục Mới"}
              </div>
              <div style={{ fontSize: 12, color: "#8F877F", fontWeight: "normal" }}>
                {editingCategory ? "Cập nhật thông tin phân cấp và hiển thị" : "Tạo danh mục mới trong cây thời trang"}
              </div>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
        okText="Lưu Thông Tin"
        cancelText="Hủy"
        width={560}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          {/* Tên danh mục */}
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>Tên Danh Mục</span>}
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}>
            <Input placeholder="Ví dụ: Áo Sơ Mi Lụa, Đầm Dạ Hội, Phụ Kiện..." style={{ borderRadius: 0 }} />
          </Form.Item>

          {/* Phân cấp danh mục (Kèm Help Icon thanh lịch thay cho banner thô cứng) */}
          {isLockedAsRoot ? (
            <Form.Item
              label={
                <Space size={6}>
                  <span style={{ fontWeight: 600 }}>Cấp Bậc Danh Mục</span>
                  <Tooltip
                    title={
                      childCategories.length > 0
                        ? `Danh mục "${editingCategory?.name}" là Nốt Root và đang quản lý ${childCategories.length} danh mục con trực thuộc. Theo quy tắc hệ thống, danh mục gốc không thể gán làm con của bất kỳ danh mục nào.`
                        : `Danh mục "${editingCategory?.name}" được định danh là Nốt Root (Cấp gốc). Nốt root là cấp cao nhất quản lý nhánh thời trang, không thể gán làm con của danh mục khác.`
                    }>
                    <QuestionCircleOutlined style={{ color: "#D97706", cursor: "pointer", fontSize: 14 }} />
                  </Tooltip>
                </Space>
              }>
              <Input
                disabled
                value="📁 Cấp Gốc (Root Node) — Danh mục điều hướng cấp cao nhất"
                prefix={<FolderFilled style={{ color: "#D97706" }} />}
                suffix={
                  <Tooltip title="Cấp gốc cố định - Không thể chuyển thành con">
                    <LockOutlined style={{ color: "#D97706" }} />
                  </Tooltip>
                }
                style={{
                  background: "#FAFAF9",
                  color: "#44403C",
                  borderColor: "#E7E5E4",
                  borderRadius: 0,
                  fontWeight: 500,
                }}
              />
            </Form.Item>
          ) : (
            <Form.Item
              label={
                <Space size={6}>
                  <span style={{ fontWeight: 600 }}>Phân Cấp Trực Thuộc</span>
                  <Tooltip title="Để trống mục này nếu bạn muốn tạo Danh Mục Gốc (hiển thị trực tiếp trên thanh điều hướng Menu chính). Chọn một danh mục cha nếu bạn muốn đây là danh mục con (nhánh phân loại chi tiết).">
                    <QuestionCircleOutlined style={{ color: "#71717A", cursor: "pointer", fontSize: 14 }} />
                  </Tooltip>
                </Space>
              }
              name="parent_id">
              <Select
                placeholder="-- 📁 Cấp Gốc (Root Node) - Không có cha --"
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

          {/* Đường dẫn tĩnh (Slug) */}
          <Form.Item
            label={
              <Space size={6}>
                <span style={{ fontWeight: 600 }}>Đường Dẫn Tĩnh (Slug)</span>
                <Tooltip title="Đường dẫn thân thiện SEO trên URL trình duyệt. Để trống hệ thống sẽ tự động tạo từ tên danh mục.">
                  <QuestionCircleOutlined style={{ color: "#71717A", cursor: "pointer", fontSize: 14 }} />
                </Tooltip>
              </Space>
            }
            name="slug">
            <Input
              placeholder="ao-so-mi-lua"
              addonBefore={<span style={{ fontSize: 12, color: "#71717A" }}>fashion.vn/</span>}
              style={{ borderRadius: 0 }}
            />
          </Form.Item>

          {/* Trạng thái hoạt động */}
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>Trạng Thái Hiển Thị</span>}
            name="is_active"
            valuePropName="checked">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Switch defaultChecked />
              <span style={{ fontSize: 13, color: "#71717A" }}>
                Kích hoạt hiển thị công khai trên website và bộ lọc sản phẩm
              </span>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
