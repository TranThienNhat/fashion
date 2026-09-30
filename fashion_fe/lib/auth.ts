import Cookies from "js-cookie";
import type { User } from "./types";
import { STORAGE_KEYS } from "./constants";

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
      Cookies.remove("token");
      Cookies.remove(STORAGE_KEYS.USER);
    }
  },

  isAuthenticated: (): boolean => {
    return authUtils.getToken() !== null && authUtils.getUser() !== null;
  },

  isAdmin: (): boolean => {
    const user = authUtils.getUser();
    return user?.role === "ADMIN" || user?.role === "STAFF";
  },

  logout: () => {
    authUtils.removeSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
};
