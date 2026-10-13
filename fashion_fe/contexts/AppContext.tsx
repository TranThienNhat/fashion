"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authUtils } from "@/lib/auth";
import type { User } from "@/lib/types";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = authUtils.getToken();
      if (token) {
        if (authUtils.isTokenExpired(token)) {
          authUtils.handleTokenExpired();
          setUser(null);
          setIsAuthenticated(false);
          return;
        }
        const currentUser = authUtils.getUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    // Kiểm tra ngay khi khởi chạy app
    checkAuthStatus();

    // Kiểm tra định kỳ mỗi 30 giây để tự động đăng xuất ngay khi token hết hạn
    const interval = setInterval(checkAuthStatus, 30000);

    // Kiểm tra lại mỗi khi người dùng chuyển lại tab (focus vào trình duyệt)
    const handleFocus = () => {
      checkAuthStatus();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  const logout = () => {
    authUtils.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = () => {
    const currentUser = authUtils.getUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AppContext.Provider
      value={{ user, setUser, isAuthenticated, logout, refreshUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
