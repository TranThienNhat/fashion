"use client";

import { useEffect, useState } from "react";
import { Carousel, Skeleton } from "antd";
import { bannerAPI } from "@/lib/api";
import type { Banner } from "@/lib/types";

interface BannerAdProps {
  viTri: number;
  height?: number;
  borderRadius?: number;
}

export default function BannerAd({
  viTri,
  height = 400,
  borderRadius = 12,
}: BannerAdProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const response = await bannerAPI.layTheoViTri(viTri);
        // Chỉ lấy banner đang active và sắp xếp theo thứ tự
        const activeBanners = response.data
          .filter((b: any) => b.trang_thai)
          .sort((a: any, b: any) => (a.thu_tu || 0) - (b.thu_tu || 0));
        setBanners(activeBanners);
      } catch (error) {
        console.error("Lỗi khi tải banner:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [viTri]);

  if (loading) {
    return (
      <Skeleton.Image
        active
        style={{
          width: "100%",
          height,
          borderRadius,
        }}
      />
    );
  }

  if (banners.length === 0) return null;

  // Single banner
  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <div
        style={{
          position: "relative",
          cursor: banner.link ? "pointer" : "default",
          borderRadius,
          overflow: "hidden",
          background: "#000",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
        }}
        onClick={() => banner.link && window.open(banner.link, "_blank")}
        onMouseEnter={(e) => {
          if (banner.link) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          }
        }}
        onMouseLeave={(e) => {
          if (banner.link) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          }
        }}>
        <img
          src={banner.hinh_anh_url}
          alt={banner.tieu_de}
          style={{
            width: "100%",
            height,
            objectFit: "cover",
            display: "block",
          }}
        />
        {banner.link && (
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              backdropFilter: "blur(4px)",
            }}>
            Xem chi tiết →
          </div>
        )}
      </div>
    );
  }

  // Multiple banners - Carousel
  return (
    <div
      style={{
        borderRadius,
        overflow: "hidden",
        background: "#000",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
      <Carousel
        autoplay
        autoplaySpeed={5000}
        dots={{
          className: "custom-dots",
        }}
        effect="fade">
        {banners.map((banner) => (
          <div key={banner.id}>
            <div
              style={{
                position: "relative",
                height,
                width: "100%",
                cursor: banner.link ? "pointer" : "default",
                background: "#000",
              }}
              onClick={() => banner.link && window.open(banner.link, "_blank")}>
              <img
                src={banner.hinh_anh_url}
                alt={banner.tieu_de}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {banner.link && (
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    backdropFilter: "blur(4px)",
                  }}>
                  Xem chi tiết →
                </div>
              )}
              {/* Banner Title Overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  padding: "40px 24px 24px",
                  color: "#fff",
                }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 600,
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  }}>
                  {banner.tieu_de}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
}
