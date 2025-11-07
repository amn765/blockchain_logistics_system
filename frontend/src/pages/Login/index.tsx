// src/pages/Login/index.tsx
import React, { useState } from "react";
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Link,
  Alert 
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { api } from "../../api/http";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErr(null);
    setLoading(true);
    
    try {
      const res = await api.auth.login(form.email, form.password);
      // mock token 存储
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/app");
    } catch (e: any) {
      setErr(e.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <Box sx={{ 
      display: "flex", 
      height: "100vh", 
      alignItems: "center", 
      justifyContent: "center",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Paper sx={{ p: 4, width: 380, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom align="center" fontWeight="bold">
          企业管理系统
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          欢迎回来，请登录您的账户
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="邮箱"
            fullWidth
            margin="normal"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <TextField
            label="密码"
            type="password"
            fullWidth
            margin="normal"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {err && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {err}
            </Alert>
          )}

          <Button 
            type="submit"
            variant="contained" 
            fullWidth 
            sx={{ mt: 3, mb: 2 }} 
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              还没有账户？{" "}
              <Link 
                component={RouterLink} 
                to="/register" 
                underline="hover"
              >
                立即注册
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
