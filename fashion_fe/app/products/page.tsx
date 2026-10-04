"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Row,
  Col,
  Slider,
  Select,
  Button,
  Pagination,
  Spin,
  Empty,
  Tag,
} from "antd";
import {
  FilterOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";
import { catalogAPI } from "@/lib/api";
import { formatPrice, POPULAR_COLORS, POPULAR_SIZES } from "@/lib/constants";
import type { Product, Category, Brand } from "@/lib/types";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category_id") || "");
  const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.get("brand_id") || "");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("min_price")) || 0,
    Number(searchParams.get("max_price")) || 15000000,
  ]);
  const [selectedColor, setSelectedColor] = useState<string>(searchParams.get("color") || "");
  const [selectedSize, setSelectedSize] = useState<string>(searchParams.get("size") || "");
  const [sortOption, setSortOption] = useState<string>(searchParams.get("sort") || "newest");
  const [currentPage, setCurrentPage] = useState<number>(Number(searchParams.get("page")) || 1);
  const searchKeyword = searchParams.get("search") || "";

  // Synchronize state when URL searchParams changes (e.g. from navbar clicks)
  useEffect(() => {
    const cat = searchParams.get("category_id") || "";
    const brand = searchParams.get("brand_id") || "";
    const minP = Number(searchParams.get("min_price")) || 0;
    const maxP = Number(searchParams.get("max_price")) || 15000000;
    const col = searchParams.get("color") || "";
    const sz = searchParams.get("size") || "";
    const srt = searchParams.get("sort") || "newest";
    const pg = Number(searchParams.get("page")) || 1;

    setSelectedCategory(cat);
    setSelectedBrand(brand);
    setPriceRange((prev) => (prev[0] === minP && prev[1] === maxP ? prev : [minP, maxP]));
    setSelectedColor(col);
    setSelectedSize(sz);
    setSortOption(srt);
    setCurrentPage(pg);
  }, [searchParams]);

  // Load filter options (categories tree, brands)
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catRes, brandRes] = await Promise.all([
          catalogAPI.getCategories(),
          catalogAPI.getBrands(),
        ]);
        const flatCats = catRes.data?.flat || catRes.data?.data?.flat || [];
        const catData = flatCats.length > 0 ? flatCats : (catRes.data?.tree || catRes.data?.data?.tree || (Array.isArray(catRes.data) ? catRes.data : []));
        setCategories(Array.isArray(catData) ? catData : []);

        const brandList = brandRes.data?.data || brandRes.data?.items || (Array.isArray(brandRes.data) ? brandRes.data : []);
        setBrands(Array.isArray(brandList) ? brandList : []);
      } catch (e) {
        console.error("Lỗi tải metadata:", e);
      }
    }
    loadMeta();
  }, []);

  // Xây dựng cây phân cấp cha - con để hiển thị con đúng theo cha
  const categoryTree = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];

    const hasChildren = categories.some((c) => Array.isArray(c.children) && c.children.length > 0);
    if (hasChildren) {
      return categories.filter((c) => !c.parent_id);
    }

    const map: Record<number, Category & { children: Category[] }> = {};
    categories.forEach((c) => {
      map[c.category_id] = { ...c, children: [] };
    });

    const roots: (Category & { children: Category[] })[] = [];
    categories.forEach((c) => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.category_id]);
      } else if (!c.parent_id) {
        roots.push(map[c.category_id]);
      }
    });

    categories.forEach((c) => {
      if (c.parent_id && !map[c.parent_id] && !roots.some((r) => r.category_id === c.category_id)) {
        roots.push(map[c.category_id]);
      }
    });

    return roots;
  }, [categories]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await catalogAPI.getProducts({
        category_id: selectedCategory || undefined,
        brand_id: selectedBrand || undefined,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 15000000 ? priceRange[1] : undefined,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
        search: searchKeyword || undefined,
        sort: sortOption,
        page: currentPage - 1,
        page_size: 12,
      });

      const pList = res.data?.content || res.data?.data?.content || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      setProducts(Array.isArray(pList) ? pList : []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error("Lỗi tải sản phẩm:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedBrand, priceRange, selectedColor, selectedSize, sortOption, currentPage, searchKeyword]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateUrlFilter = (newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === null) {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    router.push(`/products?${params.toString()}`);
  };

  const handleResetFilters = () => {
    router.push("/products");
  };

  const getPageTitle = () => {
    if (searchKeyword) return `Kết quả tìm kiếm cho "${searchKeyword}"`;
    if (selectedCategory) {
      const cat = categories.find((c) => String(c.category_id) === String(selectedCategory));
      if (cat) return cat.name;
    }
    if (sortOption === "newest" && !selectedCategory && !selectedBrand) return "Bộ Sưu Tập Mới Nhất";
    return "Bộ Sưu Tập Thời Trang";
  };

  const getBreadcrumb = () => {
    if (selectedCategory) {
      const cat = categories.find((c) => String(c.category_id) === String(selectedCategory));
      if (cat) return cat.name;
    }
    return "Danh Mục Sản Phẩm";
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "40px 24px" }}>
        {/* Breadcrumb / Title Bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <Link href="/" style={{ color: "#71717A", textDecoration: "none" }}>Trang Chủ</Link> / {getBreadcrumb()}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 36, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#18181B" }}>
                {getPageTitle()}
              </h1>
              <span style={{ fontSize: 13, color: "#71717A" }}>
                Hiển thị {products.length} trên tổng số {total} sản phẩm
              </span>
            </div>

            {/* Sắp xếp */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#71717A" }}>Sắp xếp theo:</span>
              <Select
                value={sortOption}
                onChange={(val) => updateUrlFilter({ sort: val, page: 1 })}
                style={{ width: 180 }}
                options={[
                  { value: "newest", label: "Mới nhất" },
                  { value: "price_asc", label: "Giá: Thấp đến Cao" },
                  { value: "price_desc", label: "Giá: Cao đến Thấp" },
                  { value: "name_asc", label: "Tên: A - Z" },
                ]}
              />
            </div>
          </div>
        </div>

        <Row gutter={[32, 32]}>
          {/* SIDEBAR FILTERS */}
          <Col xs={24} md={6}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #EAEAE8",
                padding: "24px 20px",
                position: "sticky",
                top: 96,
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0D0D0D" }}>
                  <FilterOutlined style={{ marginRight: 8 }} /> Bộ Lọc
                </span>
                {(selectedCategory || selectedBrand || selectedColor || selectedSize || priceRange[0] > 0 || priceRange[1] < 15000000) && (
                  <Button
                    type="link"
                    size="small"
                    onClick={handleResetFilters}
                    style={{ color: "#0D0D0D", padding: 0, textDecoration: "underline", fontSize: 12 }}>
                    Xóa tất cả
                  </Button>
                )}
              </div>

              {/* 1. Danh mục */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px", color: "#0D0D0D", fontWeight: 600 }}>
                  Danh Mục
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                  <div
                    onClick={() => updateUrlFilter({ category_id: undefined, page: 1 })}
                    style={{
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: selectedCategory === "" ? 600 : 400,
                      color: selectedCategory === "" ? "#0D0D0D" : "#71717A",
                      borderLeft: selectedCategory === "" ? "2px solid #0D0D0D" : "2px solid transparent",
                      paddingLeft: 8,
                      paddingTop: 3,
                      paddingBottom: 3,
                      transition: "all 0.2s ease",
                    }}>
                    Tất cả danh mục
                  </div>

                  {categoryTree.map((parent) => {
                    const isParentSelected = selectedCategory === String(parent.category_id);
                    const hasChildren = Array.isArray(parent.children) && parent.children.length > 0;

                    return (
                      <div key={parent.category_id} style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                        {/* Danh mục cha */}
                        <div
                          onClick={() => updateUrlFilter({ category_id: String(parent.category_id), page: 1 })}
                          style={{
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: isParentSelected ? 600 : 500,
                            color: isParentSelected ? "#0D0D0D" : "#18181B",
                            borderLeft: isParentSelected ? "2px solid #0D0D0D" : "2px solid transparent",
                            paddingLeft: 8,
                            paddingTop: 3,
                            paddingBottom: 3,
                            transition: "all 0.2s ease",
                          }}>
                          {parent.name}
                        </div>

                        {/* Danh mục con nằm ngay bên dưới danh mục cha tương ứng */}
                        {hasChildren && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingLeft: 12 }}>
                            {(parent.children || []).map((child: any) => {
                              const isChildSelected = selectedCategory === String(child.category_id);
                              return (
                                <div
                                  key={child.category_id}
                                  onClick={() => updateUrlFilter({ category_id: String(child.category_id), page: 1 })}
                                  style={{
                                    cursor: "pointer",
                                    fontSize: 12.5,
                                    fontWeight: isChildSelected ? 600 : 400,
                                    color: isChildSelected ? "#0D0D0D" : "#71717A",
                                    borderLeft: isChildSelected ? "2px solid #0D0D0D" : "2px solid transparent",
                                    paddingLeft: 8,
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                    transition: "all 0.2s ease",
                                  }}>
                                  ↳ {child.name}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Thương hiệu */}
              <div style={{ marginBottom: 24, borderTop: "1px solid #F4F4F5", paddingTop: 16 }}>
                <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px", color: "#18181B" }}>
                  Thương Hiệu
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(Array.isArray(brands) ? brands : []).map((b) => (
                    <Tag.CheckableTag
                      key={b.brand_id}
                      checked={selectedBrand === String(b.brand_id)}
                      onChange={(checked) => updateUrlFilter({ brand_id: checked ? String(b.brand_id) : undefined, page: 1 })}
                      style={{ borderRadius: 0, padding: "4px 10px" }}>
                      {b.name}
                    </Tag.CheckableTag>
                  ))}
                </div>
              </div>

              {/* 3. Khoảng giá */}
              <div style={{ marginBottom: 24, borderTop: "1px solid #F4F4F5", paddingTop: 16 }}>
                <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px", color: "#18181B" }}>
                  Khoảng Giá
                </h4>
                <Slider
                  range
                  min={0}
                  max={15000000}
                  step={500000}
                  value={priceRange}
                  onChange={(val) => setPriceRange(val as [number, number])}
                  onAfterChange={(val) => {
                    const v = val as [number, number];
                    updateUrlFilter({
                      min_price: v[0] > 0 ? v[0] : undefined,
                      max_price: v[1] < 15000000 ? v[1] : undefined,
                      page: 1,
                    });
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#71717A" }}>
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>

              {/* 4. Màu sắc */}
              <div style={{ marginBottom: 24, borderTop: "1px solid #F4F4F5", paddingTop: 16 }}>
                <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px", color: "#18181B" }}>
                  Màu Sắc
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {POPULAR_COLORS.map((col) => (
                    <div
                      key={col.name}
                      onClick={() =>
                        updateUrlFilter({
                          color: selectedColor === col.name ? undefined : col.name,
                          page: 1,
                        })
                      }
                      title={col.name}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: col.hex,
                        border: col.hex === "#FFFFFF" ? "1px solid #D4D4D8" : "none",
                        cursor: "pointer",
                        outline: selectedColor === col.name ? "2px solid #0D0D0D" : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
                {selectedColor && (
                  <div style={{ fontSize: 12, color: "#0D0D0D", marginTop: 8 }}>
                    Đã chọn: <b>{selectedColor}</b>
                  </div>
                )}
              </div>

              {/* 5. Kích thước (Size) */}
              <div style={{ borderTop: "1px solid #F4F4F5", paddingTop: 16 }}>
                <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px", color: "#0D0D0D", fontWeight: 600 }}>
                  Kích Thước (Size)
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {POPULAR_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        updateUrlFilter({
                          size: selectedSize === s ? undefined : s,
                          page: 1,
                        })
                      }
                      className={`size-chip ${selectedSize === s ? "active" : ""}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Col>

          {/* PRODUCT GRID */}
          <Col xs={24} md={18}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" />
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", background: "#FFFFFF", border: "1px solid #EAEAE8" }}>
                <Empty description="Không tìm thấy sản phẩm nào phù hợp với bộ lọc" />
                <Button onClick={handleResetFilters} style={{ marginTop: 16, borderRadius: 0 }}>
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <>
                <Row gutter={[24, 28]}>
                  {(Array.isArray(products) ? products : []).map((prod) => (
                    <Col xs={12} sm={12} md={8} lg={6} key={prod.product_id}>
                      <div className="fashion-card" style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
                        <Link href={`/products/${prod.product_id}`} style={{ textDecoration: "none", color: "inherit" }}>
                          <div className="fashion-image-container" style={{ aspectRatio: "3/4", background: "#F9F9F8" }}>
                            <img
                              src={prod.thumbnail || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"}
                              alt={prod.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>

                          <div style={{ padding: "14px 10px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontSize: 10, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                {prod.brand_name || prod.category_name}
                              </div>
                              <h4
                                style={{
                                  margin: "4px 0 8px",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: "#0D0D0D",
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  lineHeight: 1.4,
                                }}>
                                {prod.name}
                              </h4>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#0D0D0D" }}>
                                {formatPrice(prod.base_price)}
                              </span>
                              <span style={{ fontSize: 11, color: "#8F877F", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Mua ngay →
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                <div style={{ marginTop: 48, display: "flex", justifyContent: "center" }}>
                  <Pagination
                    current={currentPage}
                    pageSize={12}
                    total={total}
                    onChange={(page) => {
                      updateUrlFilter({ page });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    showSizeChanger={false}
                  />
                </div>
              </>
            )}
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
