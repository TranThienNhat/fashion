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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderFilled,
  QuestionCircleOutlined,
  LockOutlined,
  ApartmentOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { catalogAPI, getApiMessage, getApiError } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<"ALL" | "ROOT" | "SUB">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await catalogAPI.adminGetCategories();
      const list = res.data?.flat || res.data?.data?.flat || (Array.isArray(res.data) ? res.data : []);
      setCategories(Array.isArray(list) ? list : []);
    } catch (err: any) {
      message.error(getApiError(err, "Lỗi khi tải cây danh mục sản phẩm"));
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
        const res = await catalogAPI.adminUpdateCategory(editingCategory.category_id, values);
        message.success(getApiMessage(res, "Cập nhật danh mục thành công"));
      } else {
        const res = await catalogAPI.adminCreateCategory(values);
        message.success(getApiMessage(res, "Thêm danh mục mới thành công"));
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(getApiError(err, "Lỗi khi lưu thông tin danh mục"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await catalogAPI.adminDeleteCategory(id);
      message.success(getApiMessage(res, "Đã cập nhật trạng thái danh mục"));
      fetchCategories();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể thao tác ẩn danh mục"));
    }
  };

  const handleToggleActive = async (cat: Category, newActive: boolean) => {
    try {
      const res = await catalogAPI.adminUpdateCategory(cat.category_id, {
        name: cat.name,
        slug: cat.slug,
        parent_id: cat.parent_id,
        is_active: newActive,
      });
      message.success(getApiMessage(res, `Đã ${newActive ? "khôi phục hiển thị" : "ẩn"} danh mục '${cat.name}'.`));
      fetchCategories();
    } catch (err: any) {
      message.error(getApiError(err, `Không thể thay đổi trạng thái danh mục.`));
    }
  };

  const handlePurge = async (cat: Category) => {
    try {
      const res = await catalogAPI.adminDeleteCategory(cat.category_id, true);
      message.success(getApiMessage(res, `Đã xóa vĩnh viễn danh mục '${cat.name}'.`));
      fetchCategories();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể xóa vĩnh viễn danh mục này."));
    }
  };

  // 1. Phân loại danh mục gốc (Root)
  const rootCategories = categories.filter((c) => !c.parent_id);

  // 2. Sắp xếp thứ tự phân cấp chuẩn: Danh mục Cha xong đến ngay các danh mục Con trực thuộc
  const hierarchicallyOrderedCategories: Category[] = [];
  rootCategories.forEach((root) => {
    hierarchicallyOrderedCategories.push(root);
    const children = categories.filter((c) => c.parent_id === root.category_id);
    children.forEach((child) => {
      hierarchicallyOrderedCategories.push(child);
    });
  });

  // Bổ sung các danh mục con mồ côi (nếu có phát sinh)
  const orphanCategories = categories.filter(
    (c) => c.parent_id && !rootCategories.some((r) => r.category_id === c.parent_id)
  );
  orphanCategories.forEach((orphan) => {
    hierarchicallyOrderedCategories.push(orphan);
  });

  // Xác định nốt đang sửa có phải là root node hay không
  const isEditingRoot = editingCategory && !editingCategory.parent_id;
  const childCategories = editingCategory
    ? categories.filter((c) => c.parent_id === editingCategory.category_id)
    : [];
  const isLockedAsRoot = isEditingRoot || childCategories.length > 0;

  // Lọc dữ liệu hiển thị trên bảng
  const filteredCategories = hierarchicallyOrderedCategories.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.parent_name && c.parent_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterLevel === "ROOT") return !c.parent_id;
    if (filterLevel === "SUB") return !!c.parent_id;

    if (filterStatus === "ACTIVE") return Boolean(c.is_active);
    if (filterStatus === "INACTIVE") return !c.is_active;

    return true;
  });

  return (
    <div>
      {/* Header chính */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Cây Danh Mục Sản Phẩm
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Danh mục hiển thị theo thứ tự phân tầng: Danh mục Cha đứng trước, tiếp nối ngay bên dưới là các danh mục Con trực thuộc
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

      {/* Bảng Danh Sách Danh Mục */}
      <div style={{ background: "#FFFFFF", border: "1px solid #EAEAE8", padding: 20 }}>
        {/* Thanh công cụ: Tìm kiếm & Lọc cấp bậc & Lọc trạng thái */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <Input
            placeholder="Tìm kiếm danh mục theo tên, slug, hoặc danh mục cha..."
            prefix={<SearchOutlined style={{ color: "#9CA3AF" }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 360, borderRadius: 0 }}
            allowClear
          />

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#71717A" }}>
              Hiển thị: <b>{filteredCategories.length}</b> danh mục ({rootCategories.length} gốc, {categories.length - rootCategories.length} con)
            </span>
            <Select
              value={filterLevel}
              onChange={(val) => setFilterLevel(val)}
              style={{ width: 160, borderRadius: 0 }}
              options={[
                { value: "ALL", label: "Tất cả cấp bậc" },
                { value: "ROOT", label: "📁 Chỉ Cấp Gốc (Root)" },
                { value: "SUB", label: "↳ Chỉ Cấp Con (Sub)" },
              ]}
            />
            <Select
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              style={{ width: 160, borderRadius: 0 }}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "ACTIVE", label: "● Đang hiển thị" },
                { value: "INACTIVE", label: "○ Đang bị ẩn" },
              ]}
            />
          </div>
        </div>

        <Table
          dataSource={filteredCategories}
          rowKey="category_id"
          loading={loading}
          pagination={false}
          rowClassName={(rec) => (!rec.parent_id ? "table-row-root" : "table-row-sub")}
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
                      <span style={{ color: "#C5A880", fontSize: 14, fontWeight: 700 }}>↳</span>
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
                  <Tag color="volcano" style={{ borderRadius: 0, border: "none" }}>
                    ○ Đang bị ẩn
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
                    <Tooltip title="Chỉnh sửa danh mục (Tên, slug, phân cấp, trạng thái)">
                      <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(rec)} />
                    </Tooltip>

                    {isRoot && rec.is_active && (
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

                    {rec.is_active ? (
                      <Popconfirm
                        title="Ẩn danh mục này?"
                        description="Danh mục sẽ tạm ẩn khỏi thanh menu và bộ lọc khách hàng."
                        onConfirm={() => handleDelete(rec.category_id)}
                        okText="Ẩn"
                        cancelText="Hủy">
                        <Tooltip title="Ẩn khỏi cửa hàng">
                          <Button size="small" style={{ color: "#D97706", borderColor: "#FCD34D", fontSize: 12 }}>
                            Ẩn
                          </Button>
                        </Tooltip>
                      </Popconfirm>
                    ) : (
                      <>
                        <Tooltip title="Bật hiển thị lại danh mục trên cửa hàng">
                          <Button
                            size="small"
                            onClick={() => handleToggleActive(rec, true)}
                            style={{ color: "#16A34A", borderColor: "#86EFAC", fontSize: 12, fontWeight: 500 }}>
                            Hiện lại
                          </Button>
                        </Tooltip>

                        <Popconfirm
                          title="Xóa vĩnh viễn danh mục này?"
                          description="Nếu danh mục chưa có sản phẩm nào, hệ thống sẽ xóa hẳn khỏi Database và giải phóng hoàn toàn tên/slug."
                          onConfirm={() => handlePurge(rec)}
                          okText="Xóa hẳn"
                          okButtonProps={{ danger: true }}
                          cancelText="Hủy">
                          <Tooltip title="Xóa vĩnh viễn khỏi Database">
                            <Button size="small" danger icon={<DeleteOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      </>
                    )}
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
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
            💡 <b>Quy tắc hệ thống:</b> Tên và Slug có thể chỉnh sửa tự do. Nếu tạo danh mục mới trùng tên hoặc slug với một danh mục <b>đang bị ẩn</b>, hệ thống sẽ tự động khôi phục và cập nhật lại danh mục đó cho bạn.
          </div>

          {/* Tên danh mục */}
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>Tên Danh Mục</span>}
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên danh mục" },
              {
                validator: (_, value) => {
                  if (!value || !value.trim()) return Promise.resolve();
                  const trimmed = value.trim().toLowerCase();
                  const duplicate = categories.find(
                    (c) =>
                      c.name.trim().toLowerCase() === trimmed &&
                      Boolean(c.is_active) &&
                      (!editingCategory || c.category_id !== editingCategory.category_id)
                  );
                  if (duplicate) {
                    return Promise.reject(
                      new Error(`Tên danh mục "${value.trim()}" đã tồn tại và đang hiển thị. Không được đặt tên trùng nhau!`)
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}>
            <Input
              placeholder="Ví dụ: Áo Sơ Mi Lụa, Đầm Dạ Hội, Phụ Kiện..."
              style={{ borderRadius: 0 }}
              onChange={(e) => {
                if (!editingCategory) {
                  const autoSlug = e.target.value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/đ/g, "d")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .trim()
                    .replace(/\s+/g, "-");
                  form.setFieldsValue({ slug: autoSlug });
                }
              }}
            />
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
                <Tooltip title="Đường dẫn thân thiện SEO trên URL trình duyệt. Slug phải là duy nhất và không được trùng với bất kỳ danh mục nào khác.">
                  <QuestionCircleOutlined style={{ color: "#71717A", cursor: "pointer", fontSize: 14 }} />
                </Tooltip>
              </Space>
            }
            name="slug"
            rules={[
              {
                validator: (_, value) => {
                  if (!value || !value.trim()) return Promise.resolve();
                  const trimmed = value.trim().toLowerCase();
                  const duplicate = categories.find(
                    (c) =>
                      c.slug.trim().toLowerCase() === trimmed &&
                      Boolean(c.is_active) &&
                      (!editingCategory || c.category_id !== editingCategory.category_id)
                  );
                  if (duplicate) {
                    return Promise.reject(
                      new Error(
                        `Đường dẫn slug "/${value.trim()}" đã được dùng bởi danh mục "${duplicate.name}" đang hiển thị. Không được đặt slug trùng nhau!`
                      )
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}>
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
