"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Tooltip, Spin } from "antd";
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  ShopOutlined,
} from "@ant-design/icons";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { aiAPI } from "@/lib/api";

interface ProductCardData {
  product_id: number;
  name: string;
  slug?: string;
  base_price: number;
  thumbnail?: string;
  category_name?: string;
  colors?: string[];
  sizes?: string[];
  total_stock?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ProductCardData[];
  timestamp: string;
}

const DEFAULT_QUICK_CHIPS = [
  "Áo Blazer dạ Cashmere",
  "Đầm dạ hội tiệc tối",
  "Áo sơ mi lụa cổ Cuba",
  "Áo măng tô dạ cừu",
  "Túi xách da bò thảo mộc",
  "Các sản phẩm dưới 3 triệu",
];

const SparkleIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ display: "inline-block", ...style }}>
    <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
    <path d="M19 15L20.2 17.8L23 19L20.2 20.2L19 23L17.8 20.2L15 19L17.8 17.8L19 15Z" opacity="0.85" />
  </svg>
);

export default function AiChatAssistant() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);


  // Khởi tạo tin nhắn chào mừng ban đầu
  useEffect(() => {
    const initialWelcome: ChatMessage = {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Xin chào quý khách! Em là **Trợ lý Thời trang AI** của Vinh Store ✨.\n\n" +
        "Em chuyên tư vấn về các mẫu trang phục cao cấp, kích cỡ (size), chất liệu, màu sắc và gợi ý phong cách phối đồ chuẩn may đo độc quyền tại cửa hàng.\n\n" +
        "Quý khách đang quan tâm đến sản phẩm hoặc phong cách nào hôm nay ạ?",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([initialWelcome]);
  }, []);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [messages, isOpen]);

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowNotificationBadge(false);
  };

  const handleClearHistory = () => {
    const welcomeAgain: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      content:
        "Em đã đặt lại cuộc trò chuyện! Quý khách cần em tư vấn mẫu trang phục hoặc thông tin sản phẩm nào tại Vinh Store ạ?",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcomeAgain]);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      // Chuẩn bị lịch sử hội thoại rút gọn gửi lên Backend
      const history = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiAPI.chat({ message: textToSend, history });
      const data = res.data?.data || res.data || {};
      const reply = data.reply || "Dạ em đã nhận được câu hỏi của quý khách.";
      const products = Array.isArray(data.products) ? data.products : [];

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply,
        products: products,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("[AI Chat Error]:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "Dạ hệ thống trợ lý tạm thời gián đoạn trong giây lát. Quý khách vui lòng thử lại hoặc liên hệ hotline cửa hàng để được hỗ trợ tức thì nhé ạ!",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val?: number) => {
    if (!val) return "0 ₫";
    return `${Number(val).toLocaleString("vi-VN")} ₫`;
  };

  const formatImageUrl = (url?: string) => {
    if (!url) return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* 1. NÚT NỔI LAUNCHER ICON CHAT Ở GÓC DƯỚI PHẢI */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}>
        {/* Tooltip mời gọi khi chưa mở chat */}
        {!isOpen && showNotificationBadge && (
          <div
            onClick={handleOpenChat}
            style={{
              background: "#0D0D0D",
              color: "#FFFFFF",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 500,
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              animation: "bounce 2s infinite ease-in-out",
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
            <span style={{ fontSize: 13 }}>✨</span>
            <span>Tư vấn thời trang AI</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setShowNotificationBadge(false);
              }}
              style={{
                marginLeft: 4,
                opacity: 0.6,
                fontSize: 11,
                cursor: "pointer",
              }}>
              ✕
            </span>
          </div>
        )}

        {/* Nút bấm tròn chính */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Mở Trợ lý AI Stylist"
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "#0D0D0D",
            color: "#FFFFFF",
            border: "1.5px solid rgba(255,255,255,0.25)",
            boxShadow: isOpen
              ? "0 10px 28px rgba(0,0,0,0.35)"
              : "0 10px 25px rgba(0,0,0,0.25), 0 0 16px rgba(212, 175, 55, 0.25)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: isOpen ? "rotate(90deg)" : "scale(1)",
            position: "relative",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = isOpen ? "rotate(90deg) scale(1.06)" : "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = isOpen ? "rotate(90deg)" : "scale(1)")}>
          {isOpen ? (
            <CloseOutlined style={{ fontSize: 22 }} />
          ) : (
            <>
              <MessageOutlined style={{ fontSize: 24 }} />
              {/* Chấm xanh biểu thị trực tuyến */}
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 13,
                  height: 13,
                  background: "#10B981",
                  border: "2px solid #0D0D0D",
                  borderRadius: "50%",
                }}
              />
            </>
          )}
        </button>
      </div>

      {/* 2. CỬA SỔ HỘI THOẠI TRỢ LÝ AI (FLOATING CHAT WINDOW) */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            width: 400,
            maxWidth: "calc(100vw - 32px)",
            height: 600,
            maxHeight: "calc(100vh - 120px)",
            background: "#FFFFFF",
            borderRadius: 16,
            boxShadow: "0 20px 48px rgba(0, 0, 0, 0.22), 0 0 1px rgba(0,0,0,0.1)",
            border: "1px solid #EAEAE8",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            animation: "fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
          {/* HEADER CỬA SỔ CHAT */}
          <div
            style={{
              padding: "16px 20px",
              background: "#0D0D0D",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #27272A 0%, #0D0D0D 100%)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}>
                <SparkleIcon style={{ color: "#FDE047", fontSize: 18 }} />
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    background: "#10B981",
                    borderRadius: "50%",
                    border: "2px solid #0D0D0D",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "0.02em", color: "#FFFFFF" }}>
                  Vinh Store AI Stylist
                </div>
                <div style={{ fontSize: 11.5, color: "#A1A1AA", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                  Tư vấn sản phẩm 24/7
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Tooltip title="Làm mới cuộc trò chuyện">
                <button
                  onClick={handleClearHistory}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#A1A1AA",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#A1A1AA")}>
                  <DeleteOutlined style={{ fontSize: 15 }} />
                </button>
              </Tooltip>
              <Tooltip title="Đóng cửa sổ">
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#A1A1AA",
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#A1A1AA")}>
                  <CloseOutlined style={{ fontSize: 15 }} />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* KHUNG DANH SÁCH TIN NHẮN */}
          <div
            style={{
              flex: 1,
              padding: "16px 16px",
              overflowY: "auto",
              background: "#FAFAFA",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
            {/* THẺ GỢI Ý CÂU HỎI NHANH (QUICK CHIPS) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Gợi ý câu hỏi phổ biến:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DEFAULT_QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    disabled={loading}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E4E4E7",
                      borderRadius: 16,
                      padding: "5px 12px",
                      fontSize: 12,
                      color: "#18181B",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#0D0D0D";
                      e.currentTarget.style.color = "#FFFFFF";
                      e.currentTarget.style.borderColor = "#0D0D0D";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.color = "#18181B";
                      e.currentTarget.style.borderColor = "#E4E4E7";
                    }}>
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderBottom: "1px solid #F4F4F5", margin: "4px 0" }} />

            {/* DANH SÁCH LƯỢT CHAT */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    gap: 4,
                  }}>
                  {/* Bong bóng chat */}
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "12px 16px",
                      borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      background: isUser ? "#0D0D0D" : "#FFFFFF",
                      color: isUser ? "#FFFFFF" : "#18181B",
                      boxShadow: isUser ? "0 4px 14px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.05)",
                      border: isUser ? "none" : "1px solid #EAEAE8",
                      fontSize: 13.5,
                      lineHeight: "1.55",
                      wordBreak: "break-word",
                    }}>
                    {isUser ? (
                      msg.content
                    ) : (
                      <div className="ai-markdown-content" style={{ fontSize: 13.5 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* THẺ SẢN PHẨM TRỰC QUAN GỢI Ý KÈM THEO */}
                  {msg.products && msg.products.length > 0 && (
                    <div
                      style={{
                        width: "100%",
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#52525B", display: "flex", alignItems: "center", gap: 5 }}>
                        <ShopOutlined /> Sản phẩm liên quan tại cửa hàng:
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}>
                        {msg.products.map((prod) => (
                          <div
                            key={prod.product_id}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #EAEAE8",
                              borderRadius: 10,
                              padding: "10px",
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                              transition: "all 0.2s ease",
                            }}>
                            {/* Thumbnail */}
                            <div
                              style={{
                                width: 54,
                                height: 68,
                                borderRadius: 6,
                                overflow: "hidden",
                                background: "#F4F4F5",
                                flexShrink: 0,
                              }}>
                              <img
                                src={formatImageUrl(prod.thumbnail)}
                                alt={prod.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  color: "#0D0D0D",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}>
                                {prod.name}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0D0D0D", marginTop: 2 }}>
                                {formatPrice(prod.base_price)}
                              </div>
                              <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>
                                {prod.colors && prod.colors.length > 0 && `Màu: ${prod.colors.slice(0, 2).join(", ")}`}
                                {prod.sizes && prod.sizes.length > 0 && ` • Size: ${prod.sizes.join("/")}`}
                              </div>
                            </div>

                            {/* Button Xem chi tiết */}
                            <Link
                              href={`/products/${prod.product_id}`}
                              onClick={() => setIsOpen(false)}
                              style={{
                                flexShrink: 0,
                                background: "#0D0D0D",
                                color: "#FFFFFF",
                                padding: "6px 10px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                textDecoration: "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                transition: "background 0.2s",
                              }}>
                              Xem <ArrowRightOutlined style={{ fontSize: 10 }} />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Thời gian */}
                  <span style={{ fontSize: 10.5, color: "#A1A1AA", padding: "0 4px" }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* CHỈ BÁO TYPING LOADER */}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #EAEAE8",
                    padding: "10px 16px",
                    borderRadius: "16px 16px 16px 2px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}>
                  <Spin size="small" />
                  <span style={{ fontSize: 12.5, color: "#71717A", fontStyle: "italic" }}>
                    AI Stylist đang kiểm tra sản phẩm & soạn câu trả lời...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* KHUNG NHẬP LIỆU (FOOTER) */}
          <div
            style={{
              padding: "12px 16px",
              background: "#FFFFFF",
              borderTop: "1px solid #EAEAE8",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi về sản phẩm, kích cỡ, màu sắc, giá bán..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  fontSize: 13,
                  borderRadius: 24,
                  border: "1px solid #E4E4E7",
                  outline: "none",
                  background: "#F4F4F5",
                  color: "#0D0D0D",
                  transition: "border 0.2s, background 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0D0D0D";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E4E4E7";
                  e.currentTarget.style.background = "#F4F4F5";
                }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: inputMessage.trim() && !loading ? "#0D0D0D" : "#E4E4E7",
                  color: inputMessage.trim() && !loading ? "#FFFFFF" : "#A1A1AA",
                  border: "none",
                  cursor: inputMessage.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  flexShrink: 0,
                }}>
                <SendOutlined style={{ fontSize: 14 }} />
              </button>
            </form>

            <div
              style={{
                fontSize: 10.5,
                color: "#71717A",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}>
              <span>🛡️</span>
              <span>Trợ lý AI chỉ tư vấn sản phẩm thời trang và dịch vụ tại Vinh Store.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
