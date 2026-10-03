"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Input, Tag, Space, message, Select } from "antd";
import { SearchOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { authAPI } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await authAPI.adminGetUsers({
        page: page - 1,
        size: 10,
        search,
        role: roleFilter || undefined,
      });
      setUsers(res.data.content || []);
      setTotal(res.data.total || 0);
    } catch {
      message.error("Lỗi khi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await authAPI.adminToggleStatus(userId, !currentStatus);
      message.success(`Đã ${!currentStatus ? "kích hoạt" : "khóa"} tài khoản`);
      fetchUsers();
    } catch {
      message.error("Lỗi khi cập nhật trạng thái người dùng");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontFamily: "Cormorant Garamond, serif", margin: 0, color: "#0D0D0D", letterSpacing: "0.02em" }}>
            Quản Lý Tài Khoản Khách Hàng & Nhân Sự
          </h1>
          <span style={{ fontSize: 13, color: "#8F877F" }}>
            Xem danh bạ khách hàng, phân quyền vai trò và trạng thái tài khoản
          </span>
        </div>

        <Space>
          <Select
            placeholder="Lọc theo vai trò"
            allowClear
            value={roleFilter || undefined}
            onChange={(val) => { setRoleFilter(val); setPage(1); }}
            style={{ width: 160 }}
            options={[
              { value: "CUSTOMER", label: "Khách hàng" },
              { value: "STAFF", label: "Nhân viên" },
              { value: "ADMIN", label: "Quản trị viên" },
            ]}
          />
          <Input
            placeholder="Tìm theo tên, email, sđt..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 240 }}
          />
        </Space>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E4E4E7", padding: 20 }}>
        <Table
          dataSource={users}
          rowKey="user_id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: (p) => setPage(p),
          }}
          columns={[
            {
              title: "Họ và tên",
              dataIndex: "full_name",
              key: "full_name",
              render: (name) => <b>{name}</b>,
            },
            { title: "Email", dataIndex: "email", key: "email" },
            { title: "Số điện thoại", dataIndex: "phone_number", key: "phone_number" },
            {
              title: "Vai trò",
              dataIndex: "role",
              key: "role",
              render: (r) => {
                const roleMap: Record<string, { label: string; color: string }> = {
                  ADMIN: { label: "Quản trị viên", color: "purple" },
                  STAFF: { label: "Nhân viên", color: "blue" },
                  CUSTOMER: { label: "Khách hàng", color: "default" },
                };
                const rInfo = roleMap[r] || { label: r, color: "default" };
                return <Tag color={rInfo.color}>{rInfo.label}</Tag>;
              },
            },
            {
              title: "Trạng thái",
              dataIndex: "is_active",
              key: "is_active",
              render: (act) => (
                <Tag color={act ? "green" : "red"}>
                  {act ? "Hoạt động" : "Đã khóa"}
                </Tag>
              ),
            },
            {
              title: "Ngày tham gia",
              dataIndex: "created_at",
              key: "created_at",
              render: (dt) => dt ? new Date(dt).toLocaleDateString("vi-VN") : "N/A",
            },
            {
              title: "Hành động",
              key: "action",
              render: (_, rec) => (
                <Button
                  size="small"
                  danger={rec.is_active}
                  icon={rec.is_active ? <LockOutlined /> : <UnlockOutlined />}
                  onClick={() => handleToggleStatus(rec.user_id, rec.is_active)}>
                  {rec.is_active ? "Khóa TK" : "Mở Khóa"}
                </Button>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
