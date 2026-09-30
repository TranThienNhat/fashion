"use client";

import React, { useState, Suspense } from "react";
import { Form, Input, Button, Alert, App } from "antd";
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/api";
import { authUtils } from "@/lib/auth";

function LoginForm() {
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
      content: "Đang xác thực thông tin đăng nhập...",
      key: "login_status",
      duration: 0,
    });

    try {
      const res = await authAPI.login({
        account: values.account?.trim(),
        password: values.password,
      });

      const { token, user, message: successMsg } = res.data;
      authUtils.setSession(token, user);

      hideLoading();
      message.success({
        content: successMsg || "Đăng nhập thành công! Đang chuyển hướng...",
        key: "login_status",
        duration: 1.5,
      });

      notification.success({
        message: "Đăng nhập thành công",
        description: `Xin chào ${user.full_name || user.email}, chúc bạn có trải nghiệm mua sắm tuyệt vời tại Maison ÉLÉGANCE.`,
        placement: "topRight",
        duration: 3,
      });

      // Điều hướng người dùng dựa theo role
      const target = (user.role === "ADMIN" || user.role === "STAFF") && redirectUrl === "/" ? "/admin" : redirectUrl;
      setTimeout(() => {
        window.location.href = target;
      }, 400);
    } catch (err: any) {
      hideLoading();
      const resData = err?.response?.data;
      const errorCode = resData?.code;
      let displayError = resData?.message || resData?.error;

      if (errorCode === "AUTH_INVALID_CREDENTIALS") {
        displayError = "Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
      } else if (errorCode === "AUTH_ACCOUNT_LOCKED") {
        displayError = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.";
      } else if (errorCode === "AUTH_MISSING_FIELDS") {
        displayError = "Vui lòng nhập đầy đủ tài khoản và mật khẩu.";
      } else if (errorCode === "DATABASE_ERROR") {
        displayError = "Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau.";
      } else if (!err?.response) {
        displayError = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.";
      }

      setErrorMessage(displayError);
      message.error({
        content: displayError,
        key: "login_status",
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
        padding: 24,
      }}>
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#FFFFFF",
          border: "1px solid #E4E4E7",
          padding: "44px 38px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
        }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#18181B", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              ÉLÉGANCE
            </span>
            <span style={{ fontSize: 9, letterSpacing: "0.3em", color: "#8F877F", textTransform: "uppercase", marginTop: 4 }}>
              PARIS • ATELIER
            </span>
          </Link>
          <p style={{ color: "#71717A", fontSize: 13, marginTop: 10 }}>
            Đăng nhập để trải nghiệm không gian thời trang cao cấp
          </p>
        </div>

        {errorMessage && (
          <Alert
            message="Đăng nhập không thành công"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage(null)}
            style={{ marginBottom: 20, borderRadius: 0 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46" }}>Tài khoản hoặc Email</span>}
            name="account"
            rules={[
              { required: true, message: "Vui lòng nhập email hoặc tài khoản đăng nhập" },
              { whitespace: true, message: "Tài khoản không được chứa toàn khoảng trắng" },
            ]}>
            <Input
              prefix={<UserOutlined style={{ color: "#A1A1AA" }} />}
              placeholder="Nhập email, số điện thoại hoặc username"
              size="large"
              style={{ borderRadius: 0, height: 44 }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 13, fontWeight: 500, color: "#3F3F46" }}>Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: "#A1A1AA" }} />}
              placeholder="Nhập mật khẩu của bạn"
              size="large"
              style={{ borderRadius: 0, height: 44 }}
            />
          </Form.Item>

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
              marginTop: 10,
            }}>
            ĐĂNG NHẬP
          </Button>
        </Form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#71717A" }}>
          Chưa có tài khoản?{" "}
          <Link
            href={redirectUrl !== "/" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
            style={{ color: "#927238", fontWeight: 600, textDecoration: "none" }}>
            Đăng ký ngay
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link href="/" style={{ fontSize: 12, color: "#A1A1AA", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeftOutlined /> Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: 100 }}>Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
