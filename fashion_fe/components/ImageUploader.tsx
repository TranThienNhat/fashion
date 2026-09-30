"use client";

import React, { useState } from "react";
import { Upload, Button, message, Spin, Input, Space } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  LinkOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { uploadAPI } from "@/lib/api";

interface ImageUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  aspectRatio?: string;
  placeholderText?: string;
}

export default function ImageUploader({
  value,
  onChange,
  aspectRatio = "3/4",
  placeholderText = "Nhấp hoặc kéo thả ảnh để tải lên máy chủ",
}: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [isManualUrl, setIsManualUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  const handleCustomUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      setLoading(true);
      const res = await uploadAPI.uploadImage(file as File);
      const uploadedUrl = res.data.url;
      if (onChange) {
        onChange(uploadedUrl);
      }
      onSuccess("OK");
      message.success("Tải ảnh lên server thành công!");
    } catch (err: any) {
      console.error("Upload error:", err);
      onError(err);
      message.error(err?.response?.data?.error || "Lỗi khi tải ảnh lên server");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    if (onChange) {
      onChange("");
    }
    setInputUrl("");
  };

  const handleApplyUrl = () => {
    if (inputUrl.trim() && onChange) {
      onChange(inputUrl.trim());
      setIsManualUrl(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      {/* 1. KHI ĐÃ CÓ ẢNH */}
      {value ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 320,
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid #E4E4E7",
            background: "#FAF9F6",
          }}>
          <div
            style={{
              aspectRatio: aspectRatio,
              width: "100%",
              overflow: "hidden",
              position: "relative",
              background: "#F4F4F5",
            }}>
            <img
              src={value}
              alt="Uploaded Preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          <div
            style={{
              padding: "10px 12px",
              background: "#FFFFFF",
              borderTop: "1px solid #E4E4E7",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#059669" }}>
              <CheckCircleOutlined />
              <span
                style={{
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {value.startsWith("http://127.0.0.1:5000/uploads/") ? "Đã lưu trên Server" : "Đã có ảnh"}
              </span>
            </div>

            <Space size={8}>
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => window.open(value, "_blank")}
                title="Xem ảnh gốc"
              />
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemove}
                title="Xóa ảnh"
              />
            </Space>
          </div>
        </div>
      ) : (
        /* 2. KHI CHƯA CÓ ẢNH */
        <div>
          {!isManualUrl ? (
            <div>
              <Upload.Dragger
                name="file"
                multiple={false}
                showUploadList={false}
                customRequest={handleCustomUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                style={{
                  background: "#FAF9F6",
                  border: "1px dashed #D4D4D8",
                  borderRadius: 4,
                  padding: "24px 16px",
                  cursor: "pointer",
                }}>
                {loading ? (
                  <div style={{ padding: "20px 0" }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 12, color: "#71717A", fontSize: 13 }}>
                      Đang tải ảnh lên máy chủ...
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 36, color: "#C5A880", margin: "0 0 10px" }}>
                      <CloudUploadOutlined />
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#18181B", margin: "0 0 4px" }}>
                      {placeholderText}
                    </p>
                    <p style={{ fontSize: 12, color: "#A1A1AA", margin: 0 }}>
                      Hỗ trợ: PNG, JPG, JPEG, WEBP (Tối đa 10MB)
                    </p>
                  </div>
                )}
              </Upload.Dragger>

              <div style={{ marginTop: 8, textAlign: "right" }}>
                <Button
                  type="link"
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() => setIsManualUrl(true)}
                  style={{ color: "#71717A", fontSize: 12, padding: 0 }}>
                  Hoặc dán URL liên kết ngoài
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ background: "#FAF9F6", padding: 12, border: "1px solid #E4E4E7", borderRadius: 4 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  style={{ borderRadius: 0 }}
                />
                <Button type="primary" onClick={handleApplyUrl} style={{ borderRadius: 0 }}>
                  Áp dụng
                </Button>
              </div>
              <div style={{ marginTop: 8, textAlign: "right" }}>
                <Button
                  type="link"
                  size="small"
                  icon={<UploadOutlined />}
                  onClick={() => setIsManualUrl(false)}
                  style={{ color: "#71717A", fontSize: 12, padding: 0 }}>
                  Quay lại Tải ảnh từ máy tính
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
