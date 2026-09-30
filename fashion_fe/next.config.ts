import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bỏ qua lỗi để build nhanh
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Cấu hình ảnh - LOCAL ONLY
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
