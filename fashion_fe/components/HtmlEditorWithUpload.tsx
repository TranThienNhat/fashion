"use client";

import { useState, useEffect } from "react";
import {
  Input,
  Button,
  Space,
  Tooltip,
  Tabs,
  Upload,
  Modal,
  message,
  Image,
  Spin,
} from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  EyeOutlined,
  CodeOutlined,
  UploadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { uploadAPI } from "@/lib/api";

const { TextArea } = Input;
const { TabPane } = Tabs;

interface HtmlEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
}

export default function HtmlEditorWithUpload({
  value = "",
  onChange,
  rows = 12,
}: HtmlEditorProps) {
  const [content, setContent] = useState(value);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUploadedImages();
  }, []);

  const fetchUploadedImages = async () => {
    try {
      const response = await uploadAPI.getUploadedImages();
      setUploadedImages(response.data.images || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách ảnh:", error);
    }
  };

  const handleChange = (newValue: string) => {
    setContent(newValue);
    onChange?.(newValue);
  };

  const autoFormatToHtml = () => {
    // Tự động chuyển văn bản thô thành HTML
    let formatted = content;

    // Nếu nội dung không có thẻ HTML nào (trừ img), tự động format
    const hasHtmlTags = /<(?!img)[^>]+>/.test(formatted);

    if (!hasHtmlTags) {
      // Giữ nguyên các thẻ img
      const imgTags: string[] = [];
      formatted = formatted.replace(/(<img[^>]*>)/g, (match, p1) => {
        imgTags.push(p1);
        return `__IMG_PLACEHOLDER_${imgTags.length - 1}__`;
      });

      // Xử lý từng dòng
      const lines = formatted.split("\n");
      const result: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) {
          // Dòng trống - thêm khoảng cách
          if (
            result.length > 0 &&
            !result[result.length - 1].endsWith("</p>")
          ) {
            result[result.length - 1] += "</p>";
          }
          continue;
        }

        // Kiểm tra nếu là placeholder ảnh
        if (line.includes("__IMG_PLACEHOLDER_")) {
          if (
            result.length > 0 &&
            !result[result.length - 1].endsWith("</p>")
          ) {
            result[result.length - 1] += "</p>";
          }
          result.push(line);
          continue;
        }

        // Nếu dòng trước đó chưa đóng thẻ p, thêm <br>
        if (
          result.length > 0 &&
          !result[result.length - 1].endsWith("</p>") &&
          !result[result.length - 1].includes("__IMG_PLACEHOLDER_")
        ) {
          result[result.length - 1] += "<br>\n" + line;
        } else {
          result.push("<p>" + line);
        }
      }

      // Đóng thẻ p cuối cùng nếu cần
      if (
        result.length > 0 &&
        !result[result.length - 1].endsWith("</p>") &&
        !result[result.length - 1].includes("__IMG_PLACEHOLDER_")
      ) {
        result[result.length - 1] += "</p>";
      }

      formatted = result.join("\n\n");

      // Khôi phục các thẻ img
      imgTags.forEach((img, index) => {
        formatted = formatted.replace(`__IMG_PLACEHOLDER_${index}__`, img);
      });
    }

    handleChange(formatted);
    message.success("Đã tự động format thành HTML!");
  };

  const insertTag = (openTag: string, closeTag: string = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      openTag +
      selectedText +
      closeTag +
      content.substring(end);

    handleChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + openTag.length,
        start + openTag.length + selectedText.length
      );
    }, 0);
  };

  const insertHeading = (level: number) =>
    insertTag(`<h${level}>`, `</h${level}>`);
  const insertParagraph = () => insertTag("<p>", "</p>");
  const insertBold = () => insertTag("<strong>", "</strong>");
  const insertItalic = () => insertTag("<em>", "</em>");
  const insertUnderline = () => insertTag("<u>", "</u>");
  const insertList = (ordered: boolean) => {
    const tag = ordered ? "ol" : "ul";
    insertTag(`<${tag}>\n  <li>`, `</li>\n</${tag}>`);
  };
  const insertLink = () => {
    const url = prompt("Nhập URL:");
    if (url) insertTag(`<a href="${url}" target="_blank">`, "</a>");
  };
  const insertBreak = () => insertTag("<br />", "");

  const handleUploadImage = async (file: File) => {
    setLoading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      message.success("Upload ảnh thành công!");
      fetchUploadedImages();
      return response.data.url;
    } catch {
      message.error("Lỗi khi upload ảnh");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const insertImageFromUrl = (url: string) => {
    insertTag(
      `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`,
      ""
    );
    setImageModalVisible(false);
  };

  const handleImageUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const url = await handleUploadImage(file);
    if (url) {
      onSuccess(url);
      insertImageFromUrl(url);
    } else {
      onError(new Error("Upload failed"));
    }
  };

  return (
    <div>
      <Tabs defaultActiveKey="1">
        <TabPane
          tab={
            <span>
              <EditOutlined /> Soạn thảo
            </span>
          }
          key="1">
          <Space wrap style={{ marginBottom: 8 }}>
            <Tooltip title="Tự động format văn bản thành HTML">
              <Button type="primary" onClick={autoFormatToHtml}>
                Auto Format
              </Button>
            </Tooltip>

            <Button.Group>
              <Tooltip title="Tiêu đề 1">
                <Button onClick={() => insertHeading(1)}>H1</Button>
              </Tooltip>
              <Tooltip title="Tiêu đề 2">
                <Button onClick={() => insertHeading(2)}>H2</Button>
              </Tooltip>
              <Tooltip title="Tiêu đề 3">
                <Button onClick={() => insertHeading(3)}>H3</Button>
              </Tooltip>
              <Tooltip title="Đoạn văn">
                <Button onClick={insertParagraph}>P</Button>
              </Tooltip>
            </Button.Group>

            <Button.Group>
              <Tooltip title="In đậm">
                <Button icon={<BoldOutlined />} onClick={insertBold} />
              </Tooltip>
              <Tooltip title="In nghiêng">
                <Button icon={<ItalicOutlined />} onClick={insertItalic} />
              </Tooltip>
              <Tooltip title="Gạch chân">
                <Button
                  icon={<UnderlineOutlined />}
                  onClick={insertUnderline}
                />
              </Tooltip>
            </Button.Group>

            <Button.Group>
              <Tooltip title="Danh sách có thứ tự">
                <Button
                  icon={<OrderedListOutlined />}
                  onClick={() => insertList(true)}
                />
              </Tooltip>
              <Tooltip title="Danh sách không thứ tự">
                <Button
                  icon={<UnorderedListOutlined />}
                  onClick={() => insertList(false)}
                />
              </Tooltip>
            </Button.Group>

            <Button.Group>
              <Tooltip title="Chèn link">
                <Button icon={<LinkOutlined />} onClick={insertLink} />
              </Tooltip>
              <Tooltip title="Chèn ảnh">
                <Button
                  icon={<PictureOutlined />}
                  onClick={() => setImageModalVisible(true)}
                />
              </Tooltip>
            </Button.Group>

            <Tooltip title="Xuống dòng">
              <Button onClick={insertBreak}>BR</Button>
            </Tooltip>
          </Space>

          <TextArea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            rows={rows}
            placeholder="Nhập nội dung. Sử dụng các nút bên trên để định dạng."
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <CodeOutlined /> HTML
            </span>
          }
          key="2">
          <TextArea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            rows={rows}
            placeholder="Nhập HTML code..."
            style={{
              fontFamily: "monospace",
              fontSize: 13,
            }}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
            Chế độ HTML - Bạn có thể xem và chỉnh sửa code HTML trực tiếp
          </div>
        </TabPane>

        <TabPane
          tab={
            <span>
              <EyeOutlined /> Xem trước
            </span>
          }
          key="3">
          <div
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              padding: 16,
              minHeight: rows * 24,
              background: "#fff",
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </TabPane>
      </Tabs>

      {/* Modal chọn/upload ảnh */}
      <Modal
        title="Chèn ảnh"
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        footer={null}
        width={800}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Upload ảnh mới" key="1">
            <Upload.Dragger
              customRequest={handleImageUpload}
              showUploadList={false}
              accept="image/*"
              disabled={loading}>
              {loading ? (
                <Spin />
              ) : (
                <>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click hoặc kéo thả ảnh vào đây
                  </p>
                  <p className="ant-upload-hint">Hỗ trợ: JPG, PNG, GIF, WEBP</p>
                </>
              )}
            </Upload.Dragger>
          </TabPane>

          <TabPane tab="Chọn từ thư viện" key="2">
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {uploadedImages.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: 40, color: "#999" }}>
                  Chưa có ảnh nào. Hãy upload ảnh mới.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 16,
                  }}>
                  {uploadedImages.map((img: any) => (
                    <div
                      key={img.filename}
                      style={{
                        border: "1px solid #d9d9d9",
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                      onClick={() => insertImageFromUrl(img.url)}>
                      <Image
                        src={img.url}
                        alt={img.filename}
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                        }}
                        preview={false}
                      />
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: "#666",
                          textAlign: "center",
                        }}>
                        {img.filename.substring(0, 20)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </Modal>

      <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
        <strong>Hỗ trợ HTML:</strong> &lt;h1&gt;-&lt;h6&gt;, &lt;p&gt;,
        &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, &lt;ul&gt;, &lt;ol&gt;,
        &lt;li&gt;, &lt;a&gt;, &lt;img&gt;, &lt;br&gt;
      </div>
    </div>
  );
}
