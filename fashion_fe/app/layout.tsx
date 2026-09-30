import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import viVN from "antd/locale/vi_VN";
import { AppProvider } from "@/contexts/AppContext";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "ÉLÉGANCE — Maison de Haute Couture & Minimalist Luxury",
  description:
    "Thương hiệu thời trang tối giản cao cấp tôn vinh vẻ đẹp tinh tế, đường cắt may chuẩn xác và sự sang trọng kín đáo vượt thời gian.",
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
                colorPrimary: "#0D0D0D",
                colorLink: "#0D0D0D",
                colorLinkHover: "#525252",
                colorBorder: "#EAEAE8",
                borderRadius: 0,
                fontFamily:
                  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              },
              components: {
                Button: {
                  borderRadius: 0,
                  controlHeight: 44,
                  paddingContentHorizontal: 24,
                },
                Input: {
                  borderRadius: 0,
                  activeBorderColor: "#0D0D0D",
                  hoverBorderColor: "#737373",
                },
                Select: {
                  borderRadius: 0,
                },
                Tag: {
                  borderRadius: 0,
                },
                Modal: {
                  borderRadiusLG: 0,
                },
                Card: {
                  borderRadiusLG: 0,
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
