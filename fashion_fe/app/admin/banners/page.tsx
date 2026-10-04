"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Popconfirm,
  Switch,
  App,
  Upload,
  Image,
  InputNumber,
  Select,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { bannerAPI, getApiMessage, getApiError } from "@/lib/api";
import type { Banner } from "@/lib/types";

export default function AdminBannersPage() {
  const { message } = App.useApp();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await bannerAPI.layTatCa();
      const bList = response.data?.data || response.data?.items || (Array.isArray(response.data) ? response.data : []);
      setBanners(Array.isArray(bList) ? bList : []);
    } catch (error: any) {
      message.error(getApiError(error, "Không thể tải danh sách banner hiển thị."));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBanner(null);
    form.resetFields();
    form.setFieldsValue({
      vi_tri: 1,
      thu_tu: 1,
      trang_thai: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Banner) => {
    setEditingBanner(record);
    form.setFieldsValue({
      tieu_de: record.tieu_de,
      link: record.link,
      vi_tri: record.vi_tri,
      thu_tu: record.thu_tu,
      trang_thai: record.trang_thai,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await bannerAPI.xoa(id);
      message.success(getApiMessage(res, "Đã xóa banner thành công."));
      fetchBanners();
    } catch (error: any) {
      message.error(getApiError(error, "Không thể xóa banner. Vui lòng thử lại."));
    }
  };

  const handleToggleTrangThai = async (id: number, trangThai: boolean) => {
    try {
      const res = await bannerAPI.capNhatTrangThai(id, { trang_thai: trangThai });
      message.success(getApiMessage(res, `Đã ${trangThai ? "bật hiển thị" : "tắt hiển thị"} banner thành công.`));
      fetchBanners();
    } catch (error: any) {
      message.error(getApiError(error, "Không thể cập nhật trạng thái hiển thị của banner."));
    }
  };

  const handleSubmit = async (values: {
    tieu_de: string;
    link?: string;
    vi_tri: number;
    thu_tu: number;
    trang_thai: boolean;
    hinh_anh?: Array<{ originFileObj?: File }>;
  }) => {
    try {
      const formData = new FormData();
      formData.append("tieu_de", values.tieu_de);
      formData.append("vi_tri", values.vi_tri.toString());
      formData.append("thu_tu", values.thu_tu.toString());
      formData.append("trang_thai", values.trang_thai ? "1" : "0");

      if (values.link) {
        formData.append("link", values.link);
      }

      // Xử lý upload ảnh
      if (values.hinh_anh && values.hinh_anh.length > 0) {
        const file = values.hinh_anh[0];
        if (file.originFileObj) {
          formData.append("hinh_anh", file.originFileObj);
        }
      }

      if (editingBanner) {
        const res = await bannerAPI.sua(Number(editingBanner.id), formData);
        message.success(getApiMessage(res, "Đã cập nhật banner thành công."));
      } else {
        const res = await bannerAPI.them(formData);
        message.success(getApiMessage(res, "Đã thêm banner quảng bá mới thành công."));
      }

      setModalVisible(false);
      fetchBanners();
    } catch (error: any) {
      message.error(getApiError(error, "Không thể lưu thông tin banner. Vui lòng kiểm tra lại."));
    }
  };

  const viTriOptions = [
    { value: 1, label: "Trang chủ - Banner chính" },
    { value: 2, label: "Chi tiết sản phẩm" },
    { value: 3, label: "Danh sách sản phẩm" },
    { value: 4, label: "Tin tức" },
    { value: 5, label: "Sidebar" },
  ];

  const getViTriLabel = (viTri: number) => {
    const option = viTriOptions.find((opt) => opt.value === viTri);
    return option?.label || `Vị trí ${viTri}`;
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Hình ảnh",
      dataIndex: "hinh_anh_url",
      key: "hinh_anh_url",
      width: 120,
      render: (url: string, record: Banner) =>
        url ? (
          <img
            src={url}
            alt={record.tieu_de}
            style={{
              width: 100,
              height: 60,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 60,
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
            }}>
            Không có ảnh
          </div>
        ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "tieu_de",
      key: "tieu_de",
      width: 200,
    },
    {
      title: "Vị trí",
      dataIndex: "vi_tri",
      key: "vi_tri",
      width: 180,
      render: (viTri: number) => <Tag color="blue">{getViTriLabel(viTri)}</Tag>,
    },
    {
      title: "Thứ tự",
      dataIndex: "thu_tu",
      key: "thu_tu",
      width: 80,
      align: "center" as const,
    },
    {
      title: "Link",
      dataIndex: "link",
      key: "link",
      width: 150,
      render: (link: string) =>
        link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            <LinkOutlined /> Xem
          </a>
        ) : (
          <span style={{ color: "#999" }}>Không có</span>
        ),
    },
    {
      title: "Trạng thái",
      key: "trang_thai",
      width: 100,
      render: (_: unknown, record: Banner) => (
        <Switch
          checked={record.trang_thai}
          onChange={(checked) => handleToggleTrangThai(Number(record.id), checked)}
        />
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "ngay_tao",
      key: "ngay_tao",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      fixed: "right" as const,
      render: (_: unknown, record: Banner) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa banner này?"
            onConfirm={() => handleDelete(Number(record.id))}
            okText="Có"
            cancelText="Không">
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 8 }}>Quản lý Banner</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Quản lý banner quảng cáo hiển thị trên website
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm banner
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={banners}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} banner`,
        }}
      />

      <Modal
        title={editingBanner ? "Sửa banner" : "Thêm banner"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText="Lưu"
        cancelText="Hủy">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            vi_tri: 1,
            thu_tu: 1,
            trang_thai: true,
          }}>
          <Form.Item
            name="tieu_de"
            label="Tiêu đề banner"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}>
            <Input placeholder="Nhập tiêu đề banner" />
          </Form.Item>

          <Form.Item
            name="hinh_anh"
            label="Hình ảnh banner"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
            rules={[
              {
                required: !editingBanner,
                message: "Vui lòng upload hình ảnh",
              },
            ]}>
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              accept="image/*">
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          {editingBanner && editingBanner.hinh_anh_url && (
            <Form.Item label="Hình ảnh hiện tại">
              <Image
                src={editingBanner.hinh_anh_url}
                alt="Current banner"
                width={200}
                style={{ borderRadius: 4 }}
              />
            </Form.Item>
          )}

          <Form.Item
            name="link"
            label="Link liên kết (tùy chọn)"
            extra="URL sẽ mở khi click vào banner">
            <Input
              prefix={<LinkOutlined />}
              placeholder="https://example.com"
            />
          </Form.Item>

          <Form.Item
            name="vi_tri"
            label="Vị trí hiển thị"
            rules={[{ required: true, message: "Vui lòng chọn vị trí" }]}>
            <Select options={viTriOptions} placeholder="Chọn vị trí hiển thị" />
          </Form.Item>

          <Form.Item
            name="thu_tu"
            label="Thứ tự hiển thị"
            rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
            extra="Số thứ tự càng nhỏ sẽ hiển thị trước">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="trang_thai"
            label="Trạng thái"
            valuePropName="checked">
            <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
