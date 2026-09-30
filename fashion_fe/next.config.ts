import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Chỉ định thư mục gốc để tránh cảnh báo đa lockfile
  outputFileTracingRoot: path.join(__dirname, "../"),

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
