import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import viVN from "antd/locale/vi_VN";
import { AppProvider } from "@/contexts/AppContext";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "Vinh Store — Thời Trang Nam Nữ & Phụ Kiện Cao Cấp",
  description:
    "Thương hiệu thời trang Vinh Store tôn vinh vẻ đẹp tinh tế, chuẩn mực may đo tinh xảo và phong cách thời trang hiện đại vượt thời gian.",
  icons: {
    icon: "/next-icon.svg",
    shortcut: "/next-icon.svg",
    apple: "/next-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={viVN}
            theme={{
              token: {
                zIndexPopupBase: 9999,
                colorPrimary: "#231F1C",
                colorLink: "#231F1C",
                colorLinkHover: "#A86E4B",
                colorBorder: "#E8E2D8",
                colorBgBase: "#FAF8F5",
                colorBgContainer: "#FDFBF8",
                colorText: "#231F1C",
                colorTextSecondary: "#8C8278",
                borderRadius: 2,
                fontFamily:
                  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              },
              components: {
                Button: {
                  borderRadius: 2,
                  controlHeight: 44,
                  paddingContentHorizontal: 24,
                },
                Input: {
                  borderRadius: 2,
                  activeBorderColor: "#231F1C",
                  hoverBorderColor: "#A86E4B",
                },
                Select: {
                  borderRadius: 2,
                },
                Tag: {
                  borderRadius: 2,
                },
                Modal: {
                  borderRadiusLG: 4,
                },
                Card: {
                  borderRadiusLG: 4,
                },
              },
            }}>
            <App>
              <AppProvider>
                <CartProvider>{children}</CartProvider>
              </AppProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
