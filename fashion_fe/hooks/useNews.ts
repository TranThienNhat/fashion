"use client";

import { useState, useEffect, useCallback } from "react";
import { tinTucAPI } from "@/lib/api";
import { TinTuc } from "@/lib/types";

let cachedNews: TinTuc[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export function useNews() {
  const [news, setNews] = useState<TinTuc[]>(cachedNews || []);
  const [loading, setLoading] = useState(!cachedNews);

  const fetchNews = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Nếu có cache và chưa hết hạn, dùng cache
    if (!forceRefresh && cachedNews && now - cacheTime < CACHE_DURATION) {
      setNews(cachedNews);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await tinTucAPI.layTatCa();
      const data = response.data;
      cachedNews = data;
      cacheTime = now;
      setNews(data);
    } catch (error) {
      console.error("Lỗi khi lấy tin tức:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, loading, refetch: () => fetchNews(true) };
}

export function useNewsDetail(id: number) {
  const [newsItem, setNewsItem] = useState<TinTuc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        const response = await tinTucAPI.layTheoId(id);
        setNewsItem(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy tin tức:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNewsDetail();
    }
  }, [id]);

  return { newsItem, loading };
}
