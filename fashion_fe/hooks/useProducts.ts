"use client";

import { useState, useEffect, useCallback } from "react";
import { catalogAPI } from "@/lib/api";
import type { Product } from "@/lib/types";

let cachedProducts: Product[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [loading, setLoading] = useState(!cachedProducts);

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    if (!forceRefresh && cachedProducts && now - cacheTime < CACHE_DURATION) {
      setProducts(cachedProducts);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await catalogAPI.getProducts({ page_size: 50 });
      const data = response.data.content || response.data || [];
      cachedProducts = data;
      cacheTime = now;
      setProducts(data);
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, refetch: () => fetchProducts(true) };
}

export function useProduct(id: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await catalogAPI.getProductDetail(id);
        setProduct(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  return { product, loading };
}
