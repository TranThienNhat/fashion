"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Table,
  Modal,
  Tag,
  message,
  Popconfirm,
  Tabs,
} from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { authAPI, getApiMessage, getApiError } from "@/lib/api";
import { authUtils } from "@/lib/auth";
import type { User, UserAddress } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);

  // Address Modal state
  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<UserAddress | null>(null);
  const [addrForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const [meRes, addrRes] = await Promise.all([
        authAPI.getMe(),
        authAPI.getAddresses(),
      ]);
      setUser(meRes.data);
      const aList = addrRes.data?.data || addrRes.data?.items || (Array.isArray(addrRes.data) ? addrRes.data : []);
      setAddresses(Array.isArray(aList) ? aList : []);
      profileForm.setFieldsValue({
        full_name: meRes.data.full_name,
        email: meRes.data.email,
        phone_number: meRes.data.phone_number,
      });
    } catch (err: any) {
      message.error(getApiError(err, "Không thể tải thông tin hồ sơ tài khoản. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push("/login?redirect=/profile");
      return;
    }
    loadData();
  }, [router]);

  const handleUpdateProfile = async (values: any) => {
    try {
      const res = await authAPI.updateProfile({
        full_name: values.full_name,
        phone_number: values.phone_number,
      });
      message.success(getApiMessage(res, "Cập nhật hồ sơ cá nhân thành công!"));
      loadData();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể cập nhật hồ sơ"));
    }
  };

  const handleOpenAddrModal = (addr?: UserAddress) => {
    if (addr) {
      setEditingAddr(addr);
      addrForm.setFieldsValue(addr);
    } else {
      setEditingAddr(null);
      addrForm.resetFields();
    }
    setIsAddrModalOpen(true);
  };

  const handleSaveAddress = async (values: any) => {
    try {
      if (editingAddr) {
        const res = await authAPI.updateAddress(editingAddr.address_id, values);
        message.success(getApiMessage(res, "Cập nhật địa chỉ thành công!"));
      } else {
        const res = await authAPI.addAddress(values);
        message.success(getApiMessage(res, "Thêm địa chỉ mới thành công!"));
      }
      setIsAddrModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể lưu thông tin địa chỉ"));
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const res = await authAPI.deleteAddress(id);
      message.success(getApiMessage(res, "Đã xóa địa chỉ thành công!"));
      loadData();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể xóa địa chỉ này"));
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      const res = await authAPI.setDefaultAddress(id);
      message.success(getApiMessage(res, "Đã thiết lập làm địa chỉ mặc định!"));
      loadData();
    } catch (err: any) {
      message.error(getApiError(err, "Không thể đặt địa chỉ mặc định"));
    }
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 32, fontFamily: "Cormorant Garamond, serif", margin: "0 0 32px", color: "#18181B" }}>
          Hồ Sơ Cá Nhân & Sổ Địa Chỉ
        </h1>

        <Tabs
          defaultActiveKey="profile"
          items={[
            {
              key: "profile",
              label: (
                <span style={{ fontSize: 15, fontWeight: 500 }}>
                  <UserOutlined style={{ marginRight: 6 }} /> Thông Tin Cá Nhân
                </span>
              ),
              children: (
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: "32px", maxWidth: 640 }}>
                  <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
                    <Form.Item label="Email tài khoản" name="email">
                      <Input disabled size="large" style={{ borderRadius: 0 }} />
                    </Form.Item>
                    <Form.Item
                      label="Họ và tên"
                      name="full_name"
                      rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
                      <Input size="large" style={{ borderRadius: 0 }} />
                    </Form.Item>
                    <Form.Item
                      label="Số điện thoại"
                      name="phone_number"
                      rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}>
                      <Input size="large" style={{ borderRadius: 0 }} />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      style={{ background: "#18181B", borderRadius: 0, padding: "0 32px" }}>
                      Lưu Thay Đổi
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: "addresses",
              label: (
                <span style={{ fontSize: 15, fontWeight: 500 }}>
                  <EnvironmentOutlined style={{ marginRight: 6 }} /> Sổ Địa Chỉ Giao Hàng ({addresses.length})
                </span>
              ),
              children: (
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <p style={{ margin: 0, color: "#71717A", fontSize: 13 }}>
                      Quản lý địa chỉ nhận hàng để thanh toán nhanh hơn khi mua sắm.
                    </p>
                    <Button
                      type="primary"
                      onClick={() => handleOpenAddrModal()}
                      style={{ background: "#C5A880", borderColor: "#C5A880", borderRadius: 0 }}
                      icon={<PlusOutlined />}>
                      Thêm Địa Chỉ Mới
                    </Button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {(Array.isArray(addresses) ? addresses : []).map((a) => (
                      <div
                        key={a.address_id}
                        style={{
                          border: a.is_default ? "1px solid #C5A880" : "1px solid #E4E4E7",
                          background: a.is_default ? "#FAF9F6" : "#FFFFFF",
                          padding: "16px 20px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 12,
                        }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>
                            {a.receiver_name}
                            <span style={{ fontWeight: 400, color: "#71717A", marginLeft: 10 }}>({a.receiver_phone})</span>
                            {a.is_default && (
                              <Tag color="gold" style={{ marginLeft: 12, borderRadius: 0 }}>
                                Mặc định
                              </Tag>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: "#52525B", marginTop: 4 }}>
                            {a.street_detail}, {a.ward}, {a.district}, {a.province}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                          {!a.is_default && (
                            <Button size="small" onClick={() => handleSetDefaultAddress(a.address_id)} style={{ borderRadius: 0 }}>
                              Đặt làm mặc định
                            </Button>
                          )}
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenAddrModal(a)} style={{ borderRadius: 0 }} />
                          <Popconfirm
                            title="Xóa địa chỉ này?"
                            onConfirm={() => handleDeleteAddress(a.address_id)}
                            okText="Xóa"
                            cancelText="Hủy">
                            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 0 }} />
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
        />

        {/* Modal Thêm / Sửa Địa Chỉ */}
        <Modal
          title={<span style={{ fontFamily: "serif", fontSize: 20 }}>{editingAddr ? "Chỉnh Sửa Địa Chỉ" : "Thêm Địa Chỉ Mới"}</span>}
          open={isAddrModalOpen}
          onCancel={() => setIsAddrModalOpen(false)}
          onOk={() => addrForm.submit()}
          okText="Lưu Địa Chỉ"
          cancelText="Hủy">
          <Form form={addrForm} layout="vertical" onFinish={handleSaveAddress}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Tên người nhận" name="receiver_name" rules={[{ required: true }]}>
                  <Input style={{ borderRadius: 0 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Số điện thoại" name="receiver_phone" rules={[{ required: true }]}>
                  <Input style={{ borderRadius: 0 }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Tỉnh / Thành phố" name="province" rules={[{ required: true }]}>
                  <Input placeholder="Hà Nội" style={{ borderRadius: 0 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Quận / Huyện" name="district" rules={[{ required: true }]}>
                  <Input placeholder="Hoàn Kiếm" style={{ borderRadius: 0 }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Phường / Xã" name="ward" rules={[{ required: true }]}>
                  <Input placeholder="Tràng Tiền" style={{ borderRadius: 0 }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Địa chỉ chi tiết (Số nhà, ngõ, đường)" name="street_detail" rules={[{ required: true }]}>
              <Input placeholder="Số 28 Phố Tràng Tiền" style={{ borderRadius: 0 }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
