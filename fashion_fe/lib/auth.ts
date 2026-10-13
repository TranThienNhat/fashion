import Cookies from "js-cookie";
import { message } from "antd";
import type { User } from "./types";
import { STORAGE_KEYS } from "./constants";

let isHandlingExpired = false;

export const authUtils = {
  // Lưu token và user
  setSession: (token: string, user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      Cookies.set("token", token, { expires: 7 });
      Cookies.set(STORAGE_KEYS.USER, JSON.stringify(user), { expires: 7 });
    }
  },

  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.TOKEN) || Cookies.get("token") || null;
    }
    return null;
  },

  getUser: (): User | null => {
    if (typeof window !== "undefined") {
      const userStr =
        localStorage.getItem(STORAGE_KEYS.USER) ||
        Cookies.get(STORAGE_KEYS.USER);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  removeSession: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem("token");
      Cookies.remove("token");
      Cookies.remove(STORAGE_KEYS.USER);
    }
  },

  // Kiểm tra xem token JWT đã hết hạn chưa (dựa trên trường exp trong payload)
  isTokenExpired: (token?: string | null): boolean => {
    const t = token !== undefined ? token : authUtils.getToken();
    if (!t) return true;
    try {
      const parts = t.split(".");
      if (parts.length !== 3) return true;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return false;
      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  },

  // Tự động xử lý khi token hết hạn: hiển thị thông báo rõ ràng và điều hướng về login
  handleTokenExpired: (customMsg?: string) => {
    if (typeof window === "undefined") return;
    if (isHandlingExpired) return;

    const currentPath = window.location.pathname;
    // Tránh redirect lặp nếu người dùng đang ở trang đăng nhập / đăng ký
    if (currentPath.startsWith("/login") || currentPath.startsWith("/register")) {
      authUtils.removeSession();
      return;
    }

    isHandlingExpired = true;
    authUtils.removeSession();

    const notifyMsg =
      customMsg || "Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục!";
    message.warning(notifyMsg, 4);

    setTimeout(() => {
      isHandlingExpired = false;
      const redirect = encodeURIComponent(currentPath + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }, 1200);
  },

  isAuthenticated: (): boolean => {
    const token = authUtils.getToken();
    if (!token) return false;
    if (authUtils.isTokenExpired(token)) {
      authUtils.removeSession();
      return false;
    }
    return authUtils.getUser() !== null;
  },

  isAdmin: (): boolean => {
    if (!authUtils.isAuthenticated()) return false;
    const user = authUtils.getUser();
    return user?.role === "ADMIN" || user?.role === "STAFF";
  },

  logout: (showNotice = true) => {
    authUtils.removeSession();
    if (typeof window !== "undefined") {
      if (showNotice) {
        message.info("Đã đăng xuất tài khoản thành công", 2);
      }
      setTimeout(() => {
        window.location.href = "/login";
      }, 300);
    }
  },
};
