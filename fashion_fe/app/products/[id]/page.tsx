"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Row,
  Col,
  Button,
  Radio,
  Spin,
  Rate,
  Modal,
  Tabs,
  Tag,
  message,
} from "antd";
import {
  ShoppingOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ShareAltOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { catalogAPI, reviewBlogAPI } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { authUtils } from "@/lib/auth";
import { formatPrice } from "@/lib/constants";
import type { Product, ProductVariant, ProductReview } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = Number(resolvedParams.id);
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, revRes] = await Promise.all([
          catalogAPI.getProductDetail(productId),
          reviewBlogAPI.getProductReviews(productId).catch(() => ({ data: [] })),
        ]);

        const prod: Product = prodRes.data?.data || prodRes.data;
        setProduct(prod);
        const rList = revRes.data?.data || revRes.data?.items || (Array.isArray(revRes.data) ? revRes.data : []);
        setReviews(Array.isArray(rList) ? rList : []);

        const initialImg = prod.thumbnail || (prod.images && prod.images[0]?.image_url) || "";
        setSelectedImage(initialImg);

        // Chọn biến thể đầu tiên
        if (prod.variants && prod.variants.length > 0) {
          const first = prod.variants[0];
          setSelectedColor(first.color);
          setSelectedSize(first.size);
          setSelectedVariant(first);
        }
      } catch (err) {
        console.error("Lỗi tải chi tiết sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId]);

  // Kiểm tra xem sản phẩm có phải phụ kiện hoặc sản phẩm chỉ có biến thể màu sắc
  const isAccessory = useMemo(() => {
    if (!product) return false;
    if (product.has_variants === false) return true;
    const catSlug = (product.category_slug || "").toLowerCase();
    const catName = (product.category_name || "").toLowerCase();
    const prodName = (product.name || "").toLowerCase();
    const isCatAcc =
      catSlug.includes("phu-kien") ||
      catSlug.includes("tui-xach") ||
      catSlug.includes("that-lung") ||
      catSlug.includes("dong-ho") ||
      catSlug.includes("kinh") ||
      catSlug.includes("vi-da") ||
      catName.includes("phụ kiện") ||
      catName.includes("túi xách") ||
      catName.includes("thắt lưng") ||
      catName.includes("đồng hồ") ||
      catName.includes("kính") ||
      catName.includes("ví");
    const isNameAcc =
      prodName.includes("túi") ||
      prodName.includes("ví") ||
      prodName.includes("thắt lưng") ||
      prodName.includes("kính") ||
      prodName.includes("đồng hồ") ||
      prodName.includes("phụ kiện");

    const hasOnlyStandardSize =
      product.variants &&
      product.variants.length > 0 &&
      product.variants.every((v) => {
        const s = (v.size || "").trim().toLowerCase();
        return !s || ["tiêu chuẩn", "standard", "free", "freesize", "one size", "onesize"].includes(s);
      });

    return isCatAcc || isNameAcc || Boolean(hasOnlyStandardSize);
  }, [product]);

  // Danh sách kích thước (size) THỰC TẾ có của màu đang chọn
  const availableSizesForSelectedColor = useMemo(() => {
    if (isAccessory || !product?.variants || !selectedColor) return [];
    const sizes = product.variants
      .filter((v) => (v.color || "").toLowerCase() === selectedColor.toLowerCase())
      .map((v) => v.size)
      .filter((s) => {
        const norm = (s || "").trim().toLowerCase();
        return norm && !["tiêu chuẩn", "standard", "free", "freesize", "one size"].includes(norm);
      });
    return Array.from(new Set(sizes));
  }, [isAccessory, product?.variants, selectedColor]);

  // Khi người dùng bấm đổi màu: chỉ giữ lại kích thước nếu màu đó có, ngược lại tự động chọn size đầu tiên của màu mới
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    if (!product?.variants) return;

    const variantsOfNewColor = product.variants.filter(
      (v) => (v.color || "").toLowerCase() === newColor.toLowerCase()
    );

    if (isAccessory) {
      if (variantsOfNewColor.length > 0) {
        setSelectedVariant(variantsOfNewColor[0]);
        setSelectedSize(variantsOfNewColor[0].size || "");
      }
      setQuantity(1);
      return;
    }

    const matchedSameSize = variantsOfNewColor.find(
      (v) => (v.size || "").toLowerCase() === (selectedSize || "").toLowerCase()
    );

    if (matchedSameSize) {
      setSelectedVariant(matchedSameSize);
    } else if (variantsOfNewColor.length > 0) {
      setSelectedSize(variantsOfNewColor[0].size);
      setSelectedVariant(variantsOfNewColor[0]);
    }
    setQuantity(1);
  };

  // Khi người dùng bấm đổi size
  const handleSizeChange = (newSize: string) => {
    setSelectedSize(newSize);
    if (!product?.variants) return;

    const matched = product.variants.find(
      (v) =>
        (v.color || "").toLowerCase() === (selectedColor || "").toLowerCase() &&
        (v.size || "").toLowerCase() === newSize.toLowerCase()
    );
    if (matched) {
      setSelectedVariant(matched);
      setQuantity(1);
    }
  };

  const currentPrice = selectedVariant ? selectedVariant.price : product?.base_price || 0;
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : 0;
  const isOutOfStock = currentStock <= 0;

  // Xử lý Thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!selectedVariant) {
      message.warning(isAccessory ? "Quý khách vui lòng chọn phân loại màu sắc mong muốn." : "Quý khách vui lòng chọn phân loại màu sắc và kích cỡ mong muốn.");
      return;
    }
    if (isOutOfStock) {
      message.warning(isAccessory ? "Rất tiếc, phân loại màu sắc này hiện đã tạm hết hàng." : "Rất tiếc, biến thể sản phẩm này hiện đã tạm hết hàng. Quý khách vui lòng chọn màu sắc hoặc kích cỡ khác.");
      return;
    }
    if (!authUtils.isAuthenticated()) {
      message.warning("Quý khách vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng cá nhân.");
      const returnUrl = encodeURIComponent(`/products/${productId}`);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }
    try {
      setAddingToCart(true);
      await addToCart(selectedVariant.variant_id, quantity);
    } finally {
      setAddingToCart(false);
    }
  };

  // Xử lý Mua ngay
  const handleBuyNow = () => {
    if (!selectedVariant) {
      message.warning(isAccessory ? "Quý khách vui lòng chọn phân loại màu sắc mong muốn." : "Quý khách vui lòng chọn phân loại màu sắc và kích cỡ mong muốn.");
      return;
    }
    if (isOutOfStock) {
      message.warning(isAccessory ? "Rất tiếc, phân loại màu sắc này hiện đã tạm hết hàng." : "Rất tiếc, biến thể sản phẩm này hiện đã tạm hết hàng. Quý khách vui lòng chọn màu sắc hoặc kích cỡ khác.");
      return;
    }
    if (!authUtils.isAuthenticated()) {
      message.warning("Quý khách vui lòng đăng nhập để tiến hành thanh toán đơn hàng.");
      const returnUrl = encodeURIComponent(`/checkout?variant_id=${selectedVariant.variant_id}&quantity=${quantity}`);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }
    // Chuyển tới trang checkout kèm query params
    router.push(`/checkout?variant_id=${selectedVariant.variant_id}&quantity=${quantity}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "120px 0" }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div style={{ textAlign: "center", padding: "100px 24px" }}>
          <h2>Không tìm thấy sản phẩm</h2>
          <Link href="/products">
            <Button type="primary" style={{ marginTop: 16 }}>
              Quay lại danh mục
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const allImages = [
    ...(product.thumbnail ? [{ image_id: 0, image_url: product.thumbnail }] : []),
    ...(product.images || []).filter((img) => img.image_url !== product.thumbnail),
  ];

  return (
    <MainLayout>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "40px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#71717A", marginBottom: 32 }}>
          <Link href="/" style={{ color: "#71717A", textDecoration: "none" }}>Trang Chủ</Link> /{" "}
          <Link href="/products" style={{ color: "#71717A", textDecoration: "none" }}>Bộ Sưu Tập</Link> /{" "}
          {product.category_name && (
            <>
              <Link href={`/products?category_id=${product.category_id}`} style={{ color: "#71717A", textDecoration: "none" }}>
                {product.category_name}
              </Link> /{" "}
            </>
          )}
          <span style={{ color: "#18181B", fontWeight: 500 }}>{product.name}</span>
        </div>

        <Row gutter={[48, 48]}>
          {/* CỘT TRÁI: THƯ VIỆN ẢNH TƯƠNG TÁC */}
          <Col xs={24} md={13}>
            <div style={{ display: "flex", gap: 16 }}>
              {/* Thumbnails dọc */}
              {allImages.length > 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 80, flexShrink: 0 }}>
                  {allImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(img.image_url)}
                      style={{
                        width: 80,
                        height: 104,
                        border: selectedImage === img.image_url ? "2px solid #0D0D0D" : "1px solid #EAEAE8",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}>
                      <img src={img.image_url} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Ảnh chính lớn */}
              <div
                style={{
                  flex: 1,
                  aspectRatio: "3/4",
                  position: "relative",
                  background: "#F9F9F8",
                  overflow: "hidden",
                  border: "1px solid #EAEAE8",
                }}>
                <img
                  src={selectedImage || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </Col>

          {/* CỘT PHẢI: BỘ CHỌN BIẾN THỂ & ĐẶT MUA */}
          <Col xs={24} md={11}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Brand & Name */}
              <div>
                <span style={{ fontSize: 11, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500 }}>
                  {product.brand_name || "Vinh Store"}
                </span>
                <h1
                  style={{
                    fontSize: 32,
                    fontFamily: "Cormorant Garamond, serif",
                    fontWeight: 500,
                    margin: "8px 0 12px",
                    color: "#0D0D0D",
                    lineHeight: 1.2,
                    letterSpacing: "0.02em",
                  }}>
                  {product.name}
                </h1>

                {/* Rating & Review summary */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Rate disabled defaultValue={product.rating || 5} style={{ fontSize: 13, color: "#0D0D0D" }} />
                  <span style={{ fontSize: 12, color: "#8F877F" }}>
                    {product.review_count ? `(${product.review_count} đánh giá)` : "(Chưa có đánh giá)"}
                  </span>
                  <span style={{ color: "#EAEAE8" }}>|</span>
                  <span style={{ fontSize: 12, color: "#8F877F" }}>
                    SKU: <b style={{ color: "#0D0D0D" }}>{selectedVariant?.sku || "N/A"}</b>
                  </span>
                </div>
              </div>

              {/* Price */}
              <div style={{ borderTop: "1px solid #EAEAE8", borderBottom: "1px solid #EAEAE8", padding: "16px 0" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontSize: 26, fontWeight: 600, color: "#0D0D0D", letterSpacing: "0.02em" }}>
                    {formatPrice(currentPrice)}
                  </span>
                  <span
                    style={{
                      background: "#0D0D0D",
                      color: "#FFFFFF",
                      fontSize: 10,
                      padding: "2px 8px",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                    }}>
                    AUTHENTIC
                  </span>
                </div>
              </div>

              {/* BỘ CHỌN MÀU SẮC */}
              {product.available_colors && product.available_colors.length > 0 && !["tiêu chuẩn", "standard", "mặc định"].includes((selectedColor || "").toLowerCase()) && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: product.available_colors.length > 1 ? 8 : 0, fontSize: 12 }}>
                    <span style={{ color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Màu Sắc: <b style={{ color: "#0D0D0D" }}>{selectedColor}</b>
                    </span>
                  </div>
                  {product.available_colors.length > 1 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(Array.isArray(product.available_colors) ? product.available_colors : []).map((c) => (
                        <button
                          key={c}
                          onClick={() => handleColorChange(c)}
                          style={{
                            padding: "6px 16px",
                            border: selectedColor === c ? "1px solid #0D0D0D" : "1px solid #EAEAE8",
                            background: selectedColor === c ? "#0D0D0D" : "#FFFFFF",
                            color: selectedColor === c ? "#FFFFFF" : "#0D0D0D",
                            fontWeight: selectedColor === c ? 500 : 400,
                            cursor: "pointer",
                            fontSize: 12,
                            letterSpacing: "0.05em",
                            transition: "all 0.2s ease",
                          }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BỘ CHỌN KÍCH THƯỚC (SIZE) - ẨN HOÀN TOÀN NẾU LÀ PHỤ KIỆN */}
              {!isAccessory && availableSizesForSelectedColor.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: availableSizesForSelectedColor.length > 1 ? 8 : 0, fontSize: 12 }}>
                    <span style={{ color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Kích Thước: <b style={{ color: "#0D0D0D" }}>{selectedSize}</b>
                    </span>
                    {availableSizesForSelectedColor.length > 1 && (
                      <button
                        onClick={() => setIsSizeGuideOpen(true)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0D0D0D",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontSize: 11,
                          letterSpacing: "0.05em",
                        }}>
                        Bảng Hướng Dẫn Chọn Size
                      </button>
                    )}
                  </div>
                  {availableSizesForSelectedColor.length > 1 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {availableSizesForSelectedColor.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSizeChange(s)}
                          className={`size-chip ${selectedSize === s ? "active" : ""}`}
                          style={{ minWidth: 44, textAlign: "center" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TÌNH TRẠNG TỒN KHO THỜI GIAN THỰC */}
              <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                {isOutOfStock ? (
                  <span style={{ color: "#DC2626", fontWeight: 500 }}>● Tạm hết hàng biến thể này</span>
                ) : (
                  <span style={{ color: "#059669", fontWeight: 400, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircleOutlined /> Còn hàng (Sẵn sàng giao: <b>{currentStock}</b> sản phẩm)
                  </span>
                )}
              </div>

              {/* CHỌN SỐ LƯỢNG */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 12, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.05em" }}>Số lượng:</span>
                <div style={{ display: "flex", border: "1px solid #EAEAE8", width: 110 }}>
                  <button
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={{ width: 34, height: 36, border: "none", background: "none", cursor: "pointer", fontSize: 14 }}>
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={quantity}
                    style={{ width: 42, textAlign: "center", border: "none", fontWeight: 500, fontSize: 13 }}
                  />
                  <button
                    disabled={quantity >= currentStock || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    style={{ width: 34, height: 36, border: "none", background: "none", cursor: "pointer", fontSize: 14 }}>
                    +
                  </button>
                </div>
              </div>

              {/* NÚT THÊM GIỎ HÀNG & MUA NGAY */}
              <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                <Button
                  size="large"
                  loading={addingToCart}
                  disabled={isOutOfStock || !selectedVariant}
                  onClick={handleAddToCart}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 0,
                    border: "1px solid #0D0D0D",
                    color: "#0D0D0D",
                    fontWeight: 500,
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                  icon={<ShoppingOutlined />}>
                  THÊM VÀO TÚI
                </Button>

                <Button
                  type="primary"
                  size="large"
                  disabled={isOutOfStock || !selectedVariant}
                  onClick={handleBuyNow}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 0,
                    background: "#0D0D0D",
                    borderColor: "#0D0D0D",
                    fontWeight: 500,
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                  icon={<ThunderboltOutlined />}>
                  MUA NGAY
                </Button>
              </div>

              {/* Lời cam kết bổ sung */}
              <div style={{ background: "#FAFAF9", border: "1px solid #EAEAE8", padding: "16px", marginTop: 8, fontSize: 12, color: "#6B6B6B", lineHeight: 1.7 }}>
                ✓ Đóng gói hộp quà cao cấp kèm thiệp cảm ơn Vinh Store<br />
                ✓ Kiểm tra sản phẩm cẩn trọng trước khi nhận hàng<br />
                {isAccessory ? (
                  <>✓ Đổi mới trong 30 ngày nếu phát hiện lỗi chế tác hoặc phụ kiện da/kim loại</>
                ) : (
                  <>✓ Miễn phí đổi size trong 30 ngày nếu không vừa vặn</>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* MÔ TẢ CHI TIẾT & ĐÁNH GIÁ TABS */}
        <div style={{ marginTop: 64, borderTop: "1px solid #E4E4E7", paddingTop: 32 }}>
          <Tabs
            defaultActiveKey="desc"
            items={[
              {
                key: "desc",
                label: <span style={{ fontSize: 16, fontFamily: "serif", fontWeight: 600 }}>Mô Tả Chi Tiết & Chất Liệu</span>,
                children: (
                  <div style={{ maxWidth: 840, padding: "16px 0", lineHeight: 1.8, fontSize: 14, color: "#3F3F46" }}>
                    <p>{product.description || "Sản phẩm may đo cao cấp với chất liệu tự nhiên, chuẩn form dáng thanh lịch và hiện đại."}</p>
                    {isAccessory ? (
                      <>
                        <h4 style={{ margin: "24px 0 12px", color: "#18181B" }}>Hướng Dẫn Bảo Quản & Sử Dụng Phụ Kiện</h4>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                          <li>Lau nhẹ bề mặt bằng khăn cotton mềm khô định kỳ để duy trì độ bóng sáng.</li>
                          <li>Tránh tiếp xúc trực tiếp với nước hoa, cồn, chất tẩy rửa hóa học hoặc môi trường ẩm ướt kéo dài.</li>
                          <li>Bảo quản trong túi vải (dust bag) và cất nơi thoáng mát khi không sử dụng.</li>
                          <li>Đối với phụ kiện da thật: định kỳ dưỡng sáp chuyên dụng 3-6 tháng/lần.</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <h4 style={{ margin: "24px 0 12px", color: "#18181B" }}>Hướng Dẫn Bảo Quản</h4>
                        <ul style={{ paddingLeft: 20, margin: 0 }}>
                          <li>Giặt khô chuyên dụng hoặc giặt tay với nước lạnh và dầu gội nhẹ.</li>
                          <li>Không sử dụng chất tẩy mạnh, không vắt xoắn làm hỏng phom áo.</li>
                          <li>Ủi hơi nước ở nhiệt độ thích hợp cho lụa / len cashmere.</li>
                        </ul>
                      </>
                    )}
                  </div>
                ),
              },
              {
                key: "reviews",
                label: (
                  <span style={{ fontSize: 16, fontFamily: "serif", fontWeight: 600 }}>
                    Đánh Giá Của Khách Hàng ({reviews.length})
                  </span>
                ),
                children: (
                  <div style={{ maxWidth: 840, padding: "16px 0" }}>
                    {reviews.length === 0 ? (
                      <p style={{ color: "#71717A" }}>
                        Chưa có đánh giá nào cho sản phẩm này. Khách hàng đã mua có thể để lại nhận xét tại trang Lịch Sử Đơn Hàng sau khi nhận hàng.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {(Array.isArray(reviews) ? reviews : []).map((r) => (
                          <div key={r.review_id} style={{ borderBottom: "1px solid #F4F4F5", paddingBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <b style={{ fontSize: 14 }}>{r.user_name}</b>
                              <span style={{ fontSize: 12, color: "#A1A1AA" }}>
                                {new Date(r.created_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <Rate disabled defaultValue={r.rating} style={{ fontSize: 12, color: "#C5A880", margin: "4px 0" }} />
                            <p style={{ margin: "6px 0 0", color: "#3F3F46", fontSize: 13 }}>{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* Modal Hướng Dẫn Chọn Size / Quy Cách Phụ Kiện */}
      <Modal
        title={
          <span style={{ fontFamily: "serif", fontSize: 20 }}>
            {isAccessory ? "Quy Cách Chế Tác & Bảo Quản Phụ Kiện" : "Bảng Quy Chuẩn Kích Cỡ (Size Guide)"}
          </span>
        }
        open={isSizeGuideOpen}
        onOk={() => setIsSizeGuideOpen(false)}
        onCancel={() => setIsSizeGuideOpen(false)}
        footer={null}
        width={isAccessory ? 650 : 600}>
        {isAccessory ? (
          <div style={{ padding: "12px 0", fontSize: 13, lineHeight: 1.7, color: "#3F3F46" }}>
            <div style={{ background: "#F4F4F5", padding: "12px 16px", borderRadius: 4, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: "#18181B", marginBottom: 4 }}>Quy Cách Chuẩn Mực Vinh Store:</div>
              <div>• Kích thước: Thiết kế tỷ lệ công thái học hoàn hảo, phù hợp vóc dáng người Á Đông.</div>
              <div>• Chi tiết kim loại: Khóa, móc hoặc dây kéo được mạ điện phân chống oxy hóa và xỉn màu.</div>
              <div>• Đóng gói bàn giao: Hộp carton cứng bọc lót chống sốc + túi vải nhung chống bụi (dustbag).</div>
            </div>

            <div style={{ fontWeight: 600, color: "#18181B", marginBottom: 6 }}>Nguyên Tắc Bảo Dưỡng Độ Bền:</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #E4E4E7", padding: "8px 12px", background: "#FAFAF9", width: 140, fontWeight: 600 }}>Chống ẩm ướt</td>
                  <td style={{ border: "1px solid #E4E4E7", padding: "8px 12px" }}>Không mang khi trời mưa lớn; nếu ướt hãy thấm khô tự nhiên bằng khăn mềm, tuyệt đối không dùng máy sấy nhiệt.</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #E4E4E7", padding: "8px 12px", background: "#FAFAF9", fontWeight: 600 }}>Chống biến dạng</td>
                  <td style={{ border: "1px solid #E4E4E7", padding: "8px 12px" }}>Đặt giấy độn mềm bên trong túi xách hoặc ví khi cất giữ để giữ nguyên form dáng nguyên bản.</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #E4E4E7", padding: "8px 12px", background: "#FAFAF9", fontWeight: 600 }}>Dưỡng chất liệu</td>
                  <td style={{ border: "1px solid #E4E4E7", padding: "8px 12px" }}>Sử dụng kem sáp dưỡng da chuyên dụng định kỳ mỗi quý một lần để duy trì độ mềm mại sang trọng.</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: 12, color: "#71717A", fontStyle: "italic" }}>
              * Quý khách được hỗ trợ làm sạch và bảo dưỡng bề mặt da miễn phí trong vòng 12 tháng tại hệ thống cửa hàng Vinh Store.
            </div>
          </div>
        ) : (
          <div style={{ padding: "12px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "center" }}>
              <thead>
                <tr style={{ background: "#F4F4F5", height: 40 }}>
                  <th style={{ border: "1px solid #E4E4E7" }}>Size</th>
                  <th style={{ border: "1px solid #E4E4E7" }}>Chiều cao (cm)</th>
                  <th style={{ border: "1px solid #E4E4E7" }}>Cân nặng (kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #E4E4E7", padding: 8 }}><b>S</b></td>
                  <td style={{ border: "1px solid #E4E4E7" }}>155 - 165</td>
                  <td style={{ border: "1px solid #E4E4E7" }}>45 - 55</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #E4E4E7", padding: 8 }}><b>M</b></td>
                  <td style={{ border: "1px solid #E4E4E7" }}>165 - 172</td>
                  <td style={{ border: "1px solid #E4E4E7" }}>55 - 65</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #E4E4E7", padding: 8 }}><b>L</b></td>
                  <td style={{ border: "1px solid #E4E4E7" }}>170 - 178</td>
                  <td style={{ border: "1px solid #E4E4E7" }}>65 - 75</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #E4E4E7", padding: 8 }}><b>XL</b></td>
                  <td style={{ border: "1px solid #E4E4E7" }}>175 - 185</td>
                  <td style={{ border: "1px solid #E4E4E7" }}>75 - 85</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: 12, color: "#71717A", marginTop: 16 }}>
              * Nếu số đo của bạn nằm giữa 2 size, chúng tôi khuyên bạn nên chọn size lớn hơn để mặc thoải mái và có độ rủ sang trọng nhất.
            </p>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
