import React from "react";
import { Box, AppBar, Toolbar, Typography, IconButton, CssBaseline } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const drawerWidth = 240; // 侧边栏宽度

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: `${drawerWidth}px`, // 留出侧边栏宽度
        }}
      >
        {/* 顶部 AppBar */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              供应链追踪平台（联盟链）
            </Typography>
            <Typography variant="body2">企业用户</Typography>
          </Toolbar>
        </AppBar>

        {/* 正文内容 */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            mt: "64px", // 给 AppBar 留出高度
            background: "#f5f5f5",
            overflow: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

