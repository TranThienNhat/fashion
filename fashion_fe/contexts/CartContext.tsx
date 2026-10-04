"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { cartAPI, getApiMessage, getApiError } from "@/lib/api";
import { Cart, CartItem } from "@/lib/types";
import { authUtils } from "@/lib/auth";
import { message } from "antd";

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  loading: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  fetchCart: () => Promise<void>;
  addToCart: (variantId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: number) => Promise<boolean>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!authUtils.isAuthenticated()) {
      setCart(null);
      return;
    }

    try {
      setLoading(true);
      const res = await cartAPI.getCart();
      const cartData = res.data?.data || res.data;
      if (cartData && !Array.isArray(cartData.items)) {
        cartData.items = [];
      }
      setCart(cartData);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(
    async (variantId: number, quantity = 1) => {
      if (!authUtils.isAuthenticated()) {
        message.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
        return false;
      }

      try {
        const res = await cartAPI.addToCart(variantId, quantity);
        message.success(getApiMessage(res, "Đã thêm sản phẩm vào giỏ hàng!"));
        await fetchCart();
        setIsDrawerOpen(true);
        return true;
      } catch (err: any) {
        message.error(getApiError(err, "Không thể thêm sản phẩm vào giỏ hàng"));
        return false;
      }
    },
    [fetchCart]
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      try {
        await cartAPI.updateQuantity(cartItemId, quantity);
        await fetchCart();
        return true;
      } catch (err: any) {
        message.error(getApiError(err, "Lỗi cập nhật số lượng"));
        return false;
      }
    },
    [fetchCart]
  );

  const removeFromCart = useCallback(
    async (cartItemId: number) => {
      try {
        const res = await cartAPI.removeItem(cartItemId);
        message.success(getApiMessage(res, "Đã xóa sản phẩm khỏi giỏ hàng"));
        await fetchCart();
        return true;
      } catch (err: any) {
        message.error(getApiError(err, "Lỗi khi xóa khỏi giỏ hàng"));
        return false;
      }
    },
    [fetchCart]
  );

  const clearCart = useCallback(async () => {
    try {
      const res = await cartAPI.clearCart();
      message.success(getApiMessage(res, "Đã làm trống giỏ hàng"));
      setCart(null);
    } catch (err: any) {
      message.error(getApiError(err, "Không thể làm trống giỏ hàng"));
    }
  }, []);

  const cartCount = cart?.total_quantity || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        isDrawerOpen,
        setIsDrawerOpen,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
