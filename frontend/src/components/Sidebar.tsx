import React from "react";
import { Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const menu = [
  { label: "仪表盘", path: "/app" },
  { label: "物流追踪", path: "/app/logistics" },
  { label: "资金流转", path: "/app/finance" },
  { label: "溯源查询", path: "/app/trace" },  // 新增溯源菜单
  { label: "用户管理", path: "/app/users" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const loc = useLocation();

  return (
    <Drawer variant="permanent" anchor="left">
      <Toolbar />
      <List sx={{ width: 220 }}>
        {menu.map((m) => (
          <ListItem key={m.path} disablePadding>
            <ListItemButton selected={loc.pathname === m.path} onClick={() => navigate(m.path)}>
              <ListItemText primary={m.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
