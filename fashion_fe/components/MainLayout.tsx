"use client";

import React from "react";
import MainHeader from "@/components/MainHeader";
import MainFooter from "@/components/MainFooter";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider } from "@/contexts/CartContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
      <MainHeader />
      <CartDrawer />
      <main style={{ flex: 1 }}>{children}</main>
      <MainFooter />
    </div>
  );
}
