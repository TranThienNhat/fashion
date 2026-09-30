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
  Card,
} from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  EyeOutlined,
  CodeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { uploadAPI } from "@/lib/api";

const { TextArea } = Input;
const { TabPane } = Tabs;

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
}

export default function MarkdownEditor({
  value = "",
  onChange,
  rows = 12,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(value);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
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

  const insertText = (
    before: string,
    after: string = "",
    placeholder: string = ""
  ) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    handleChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Markdown syntax helpers
  const insertHeading = (level: number) =>
    insertText("#".repeat(level) + " ", "", "Tiêu đề");
  const insertBold = () => insertText("**", "**", "chữ đậm");
  const insertItalic = () => insertText("*", "*", "chữ nghiêng");
  const insertCode = () => insertText("`", "`", "code");
  const insertCodeBlock = () => insertText("\n```\n", "\n```\n", "code block");
  const insertQuote = () => insertText("> ", "", "trích dẫn");
  const insertList = () => insertText("- ", "", "mục danh sách");
  const insertOrderedList = () => insertText("1. ", "", "mục danh sách");
  const insertLink = () => {
    const url = prompt("Nhập URL:");
    if (url) insertText("[", `](${url})`, "text link");
  };
  const insertHr = () => insertText("\n---\n", "");

  const handleUploadImage = async (file: File) => {
    setLoading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      message.success("Upload ảnh thành công!");
      fetchUploadedImages();
      return response.data.url;
    } catch (error) {
      message.error("Lỗi khi upload ảnh");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const insertImageFromUrl = (url: string, alt: string = "Image") => {
    insertText(`![${alt}](${url})`, "");
    setImageModalVisible(false);
  };

  const handleImageUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const url = await handleUploadImage(file);
    if (url) {
      onSuccess(url);
      insertImageFromUrl(url, file.name);
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
              <CodeOutlined /> Soạn thảo
            </span>
          }
          key="1">
          <Space wrap style={{ marginBottom: 8 }}>
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
            </Button.Group>

            <Button.Group>
              <Tooltip title="In đậm">
                <Button icon={<BoldOutlined />} onClick={insertBold} />
              </Tooltip>
              <Tooltip title="In nghiêng">
                <Button icon={<ItalicOutlined />} onClick={insertItalic} />
              </Tooltip>
              <Tooltip title="Code">
                <Button onClick={insertCode}>Code</Button>
              </Tooltip>
            </Button.Group>

            <Button.Group>
              <Tooltip title="Danh sách">
                <Button icon={<UnorderedListOutlined />} onClick={insertList} />
              </Tooltip>
              <Tooltip title="Danh sách số">
                <Button
                  icon={<OrderedListOutlined />}
                  onClick={insertOrderedList}
                />
              </Tooltip>
              <Tooltip title="Trích dẫn">
                <Button onClick={insertQuote}>Quote</Button>
              </Tooltip>
            </Button.Group>

            <Button.Group>
              <Tooltip title="Link">
                <Button icon={<LinkOutlined />} onClick={insertLink} />
              </Tooltip>
              <Tooltip title="Ảnh">
                <Button
                  icon={<PictureOutlined />}
                  onClick={() => setImageModalVisible(true)}
                />
              </Tooltip>
              <Tooltip title="Đường kẻ ngang">
                <Button onClick={insertHr}>HR</Button>
              </Tooltip>
            </Button.Group>
          </Space>

          <TextArea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            rows={rows}
            placeholder="Nhập nội dung Markdown. Sử dụng các nút bên trên để định dạng."
            style={{ fontFamily: "monospace" }}
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <EyeOutlined /> Xem trước
            </span>
          }
          key="2">
          <Card
            style={{
              minHeight: rows * 24,
              maxHeight: 600,
              overflowY: "auto",
            }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ node, ...props }) => (
                  <img
                    {...props}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                ),
              }}>
              {content || "*Chưa có nội dung*"}
            </ReactMarkdown>
          </Card>
        </TabPane>

        <TabPane tab="📖 Hướng dẫn" key="3">
          <Card style={{ maxHeight: 600, overflowY: "auto" }}>
            <h3>Cú pháp Markdown</h3>

            <h4>Tiêu đề</h4>
            <pre>{`# Tiêu đề 1
## Tiêu đề 2
### Tiêu đề 3`}</pre>

            <h4>Định dạng văn bản</h4>
            <pre>{`**Chữ đậm**
*Chữ nghiêng*
***Đậm và nghiêng***
~~Gạch ngang~~
\`code inline\``}</pre>

            <h4>Danh sách</h4>
            <pre>{`- Mục 1
- Mục 2
  - Mục con 2.1
  - Mục con 2.2

1. Mục đầu tiên
2. Mục thứ hai
3. Mục thứ ba`}</pre>

            <h4>Link và ảnh</h4>
            <pre>{`[Text link](https://example.com)
![Alt text ảnh](url-anh.jpg)`}</pre>

            <h4>Trích dẫn</h4>
            <pre>{`> Đây là trích dẫn
> Có thể nhiều dòng`}</pre>

            <h4>Code block</h4>
            <pre>{`\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\``}</pre>

            <h4>Bảng</h4>
            <pre>{`| Cột 1 | Cột 2 | Cột 3 |
|-------|-------|-------|
| A     | B     | C     |
| D     | E     | F     |`}</pre>

            <h4>Đường kẻ ngang</h4>
            <pre>{`---`}</pre>
          </Card>
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
                <p>Đang upload...</p>
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
                  {uploadedImages.map((img) => (
                    <div
                      key={img.filename}
                      style={{
                        border: "1px solid #d9d9d9",
                        borderRadius: 4,
                        padding: 8,
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                      onClick={() => insertImageFromUrl(img.url, img.filename)}>
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
        <strong>Markdown:</strong> Văn bản thuần với cú pháp đơn giản. Xem tab
        "Hướng dẫn" để biết thêm.
      </div>
    </div>
  );
}
