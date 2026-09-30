"use client";

import React, { useState, Suspense } from "react";
import { Form, Input, Button, Alert, App, Checkbox } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { authUtils } from "@/lib/auth";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message, notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form] = Form.useForm();
  const redirectUrl = searchParams.get("redirect") || "/";

  const onFinish = async (values: any) => {
    setLoading(true);
    setErrorMessage(null);

    const hideLoading = message.loading({
      content: "Đang khởi tạo tài khoản ÉLÉGANCE...",
      key: "register_status",
      duration: 0,
    });

    try {
      const res = await authAPI.register({
        full_name: values.full_name?.trim(),
        email: values.email?.trim().toLowerCase(),
        phone_number: values.phone_number?.trim(),
        password: values.password,
      });

      const { token, user, message: successMsg } = res.data;

      // Lưu phiên đăng nhập tự động
      if (token && user) {
        authUtils.setSession(token, user);
      }

      hideLoading();
      message.success({
        content: successMsg || "Đăng ký tài khoản thành công!",
        key: "register_status",
        duration: 2,
      });

      notification.success({
        message: "Chào mừng thành viên mới!",
        description: `Chúc mừng ${values.full_name} đã gia nhập Maison ÉLÉGANCE. Khám phá các bộ sưu tập thời trang thượng lưu ngay hôm nay.`,
        placement: "topRight",
        duration: 4,
      });

      // Điều hướng về trang trước đó hoặc trang chủ
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } catch (err: any) {
      hideLoading();
      const resData = err?.response?.data;
      const errorCode = resData?.code;
      let displayError = resData?.message || resData?.error;

      if (errorCode === "AUTH_EMAIL_EXISTS") {
        displayError = "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.";
      } else if (errorCode === "AUTH_PHONE_EXISTS") {
        displayError = "Số điện thoại này đã được sử dụng bởi một tài khoản khác.";
      } else if (errorCode === "AUTH_MISSING_FIELDS") {
        displayError = "Vui lòng điền đầy đủ tất cả các trường thông tin bắt buộc.";
      } else if (errorCode === "DATABASE_ERROR") {
        displayError = "Hệ thống cơ sở dữ liệu đang bận. Vui lòng thử lại sau giây lát.";
      } else if (!err?.response) {
        displayError = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.";
      }

      setErrorMessage(displayError || "Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.");
      message.error({
        content: displayError || "Đăng ký không thành công.",
        key: "register_status",
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAF9F6",
        padding: "40px 20px",
      }}>
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#FFFFFF",
          border: "1px solid #E4E4E7",
          padding: "44px 38px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
        }}>
        {/* Header / Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#18181B",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
            }}>
            <span
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}>
              ÉLÉGANCE
            </span>
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.3em",
                color: "#8F877F",
                textTransform: "uppercase",
                marginTop: 4,
              }}>
              PARIS • ATELIER
            </span>
          </Link>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: 22,
              fontWeight: 600,
              color: "#18181B",
              marginTop: 18,
              marginBottom: 6,
            }}>
            TẠO TÀI KHOẢN MỚI
          </h1>
          <p style={{ color: "#71717A", fontSize: 13, margin: 0 }}>
            Trở thành hội viên để nhận các đặc quyền và bộ sưu tập giới hạn
          </p>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <Alert
            message="Đăng ký không thành công"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage(null)}
            style={{ marginBottom: 20, borderRadius: 0 }}
          />
        )}

        {/* Biểu mẫu đăng ký */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ agreement: true }}>
          {/* Họ và tên */}
          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46" }}>Họ và tên</span>}
            name="full_name"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên của bạn" },
              { min: 2, message: "Họ và tên cần có ít nhất 2 ký tự" },
              { whitespace: true, message: "Họ tên không được chứa toàn khoảng trắng" },
            ]}>
            <Input
              prefix={<UserOutlined style={{ color: "#A1A1AA" }} />}
              placeholder="Ví dụ: Nguyễn Văn A"
              size="large"
              style={{ borderRadius: 0, height: 44 }}
            />
          </Form.Item>

          {/* Email */}
          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46" }}>Địa chỉ Email</span>}
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập địa chỉ email" },
              { type: "email", message: "Địa chỉ email không đúng định dạng" },
            ]}>
            <Input
              prefix={<MailOutlined style={{ color: "#A1A1AA" }} />}
              placeholder="name@example.com"
              size="large"
              style={{ borderRadius: 0, height: 44 }}
            />
          </Form.Item>

          {/* Số điện thoại */}
          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46" }}>Số điện thoại</span>}
            name="phone_number"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              {
                pattern: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/,
                message: "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)",
              },
            ]}>
            <Input
              prefix={<PhoneOutlined style={{ color: "#A1A1AA" }} />}
              placeholder="Ví dụ: 0912345678"
              size="large"
              style={{ borderRadius: 0, height: 44 }}
            />
          </Form.Item>

          {/* Mật khẩu */}
          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46" }}>Mật khẩu</span>}
            name="password"
            rules={[
              { required: true, message: "Vui lòng thiết lập mật khẩu" },
              { min: 6, message: "Mật khẩu phải chứa ít nhất 6 ký tự" },
            ]}
            hasFeedback>
            <Input.Password
              prefix={<LockOutlined style={{ color: "#A1A1AA" }} />}
              placeholder="Tối thiểu 6 ký tự"
              size="large"
              style={{ borderRadius: 0, height: 44 }}
            />
          </Form.Item>

          {/* Xác nhận mật khẩu */}
          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46" }}>Xác nhận mật khẩu</span>}
            name="confirmPassword"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận lại mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu xác nhận không trùng khớp!"));
                },
              }),
            ]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: "#A1A1AA" }} />}
              placeholder="Nhập lại mật khẩu"
              size="large"
              style={{ borderRadius: 0, height: 44 }}
            />
          </Form.Item>

          {/* Điều khoản & Cam kết */}
          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error("Bạn cần đồng ý với Điều khoản để tiếp tục")),
              },
            ]}>
            <Checkbox style={{ fontSize: 12, color: "#71717A" }}>
              Tôi đồng ý với{" "}
              <Link href="#" style={{ color: "#18181B", fontWeight: 500, textDecoration: "underline" }}>
                Điều khoản dịch vụ
              </Link>{" "}
              &{" "}
              <Link href="#" style={{ color: "#18181B", fontWeight: 500, textDecoration: "underline" }}>
                Chính sách bảo mật
              </Link>{" "}
              của ÉLÉGANCE
            </Checkbox>
          </Form.Item>

          {/* Quyền lợi thành viên ngắn gọn */}
          <div
            style={{
              background: "#FAF9F6",
              border: "1px dashed #E4E4E7",
              padding: "12px 14px",
              marginBottom: 20,
              fontSize: 12,
              color: "#52525B",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}>
            <CheckCircleFilled style={{ color: "#927238", marginTop: 2, fontSize: 14 }} />
            <span>
              Đặc quyền hội viên: Tích lũy điểm mua sắm, nhận mã ưu đãi VIP và quyền xem trước các bộ sưu tập giới hạn.
            </span>
          </div>

          {/* Nút đăng ký */}
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{
              background: "#18181B",
              borderColor: "#18181B",
              borderRadius: 0,
              height: 48,
              fontWeight: 600,
              letterSpacing: "0.1em",
            }}>
            ĐĂNG KÝ TÀI KHOẢN
          </Button>
        </Form>

        {/* Chuyển tới Đăng nhập */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#71717A" }}>
          Đã có tài khoản ÉLÉGANCE?{" "}
          <Link
            href={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
            style={{ color: "#927238", fontWeight: 600, textDecoration: "none" }}>
            Đăng nhập ngay
          </Link>
        </div>

        {/* Quay lại trang chủ */}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link
            href="/"
            style={{
              fontSize: 12,
              color: "#A1A1AA",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
            <ArrowLeftOutlined /> Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FAF9F6",
            color: "#71717A",
          }}>
          Đang tải trang đăng ký...
        </div>
      }>
      <RegisterForm />
    </Suspense>
  );
}
