import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Logistics from "@/pages/Logistics";
import Finance from "@/pages/Finance";
import Users from "@/pages/Users";
import Trace from "@/pages/Trace";  // 新增导入
import Layout from "@/components/Layout";

/**
 * NOTE:
 * - 登录后会跳转到 /app
 * - 现在没有真实鉴权，若需要可在 Layout 中或在路由层加入守卫
 */

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/app/*"
        element={
          <Layout>
            <Routes>
              <Route path="" element={<Dashboard />} />
              <Route path="logistics" element={<Logistics />} />
              <Route path="finance" element={<Finance />} />
              <Route path="users" element={<Users />} />
              <Route path="trace" element={<Trace />} />  
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
