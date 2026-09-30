"use client";

import { useState } from "react";
import { Input, Button, Space, Tooltip, Tabs } from "antd";
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
} from "@ant-design/icons";

const { TextArea } = Input;
const { TabPane } = Tabs;

interface HtmlEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
}

export default function HtmlEditor({
  value = "",
  onChange,
  rows = 12,
}: HtmlEditorProps) {
  const [content, setContent] = useState(value);

  const handleChange = (newValue: string) => {
    setContent(newValue);
    onChange?.(newValue);
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

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + openTag.length,
        start + openTag.length + selectedText.length
      );
    }, 0);
  };

  const insertHeading = (level: number) => {
    insertTag(`<h${level}>`, `</h${level}>`);
  };

  const insertParagraph = () => {
    insertTag("<p>", "</p>");
  };

  const insertBold = () => {
    insertTag("<strong>", "</strong>");
  };

  const insertItalic = () => {
    insertTag("<em>", "</em>");
  };

  const insertUnderline = () => {
    insertTag("<u>", "</u>");
  };

  const insertList = (ordered: boolean) => {
    const tag = ordered ? "ol" : "ul";
    insertTag(`<${tag}>\n  <li>`, `</li>\n</${tag}>`);
  };

  const insertLink = () => {
    const url = prompt("Nhập URL:");
    if (url) {
      insertTag(`<a href="${url}" target="_blank">`, "</a>");
    }
  };

  const insertImage = () => {
    const url = prompt("Nhập URL ảnh:");
    if (url) {
      insertTag(
        `<img src="${url}" alt="Image" style="max-width: 100%;" />`,
        ""
      );
    }
  };

  const insertBreak = () => {
    insertTag("<br />", "");
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
                <Button icon={<PictureOutlined />} onClick={insertImage} />
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
              <EyeOutlined /> Xem trước
            </span>
          }
          key="2">
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

      <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
        <strong>Hỗ trợ HTML:</strong> &lt;h1&gt;-&lt;h6&gt;, &lt;p&gt;,
        &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, &lt;ul&gt;, &lt;ol&gt;,
        &lt;li&gt;, &lt;a&gt;, &lt;img&gt;, &lt;br&gt;
      </div>
    </div>
  );
}
