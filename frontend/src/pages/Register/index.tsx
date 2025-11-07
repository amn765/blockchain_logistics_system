import React, { useState } from "react";
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  Link,
  Alert,
  MenuItem
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { api } from "../../api/http";

// 企业类型选项
const companyTypes = [
  { value: 'manufacturer', label: '生产厂商' },
  { value: 'distributor', label: '经销商' },
  { value: 'retailer', label: '零售商' },
  { value: 'service', label: '服务商' }
];

export default function Register() {
  const [form, setForm] = useState({ 
    companyName: "",
    contactPerson: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    companyType: ""
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setErr(null);
    
    // 简单的前端验证
    if (form.password !== form.confirmPassword) {
      setErr("两次输入的密码不一致");
      return;
    }
    
    if (form.password.length < 6) {
      setErr("密码长度至少6位");
      return;
    }

    setLoading(true);
    
    try {
      const res = await api.auth.register({
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        email: form.email,
        password: form.password,
        licenseNumber: form.licenseNumber,
        companyType: form.companyType
      });
      
      // mock token 存储
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      navigate("/app");
    } catch (e: any) {
      setErr(e.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister();
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  return (
    <Box sx={{ 
      display: "flex", 
      height: "100vh", 
      alignItems: "center", 
      justifyContent: "center",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 2
    }}>
      <Paper sx={{ p: 4, width: 480, borderRadius: 2, maxHeight: '90vh', overflow: 'auto' }}>
        <Typography variant="h5" gutterBottom align="center" fontWeight="bold">
          企业注册
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          填写企业信息，创建您的账户
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* 第一行：企业名称和联系人 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="企业名称"
              fullWidth
              margin="normal"
              value={form.companyName}
              onChange={handleChange('companyName')}
              required
            />
            <TextField
              label="联系人"
              fullWidth
              margin="normal"
              value={form.contactPerson}
              onChange={handleChange('contactPerson')}
              required
            />
          </Box>

          {/* 第二行：邮箱和营业执照号 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="邮箱"
              type="email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={handleChange('email')}
              required
            />
            <TextField
              label="营业执照号"
              fullWidth
              margin="normal"
              value={form.licenseNumber}
              onChange={handleChange('licenseNumber')}
              required
            />
          </Box>

          {/* 第三行：企业类型和密码 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="企业类型"
              fullWidth
              margin="normal"
              value={form.companyType}
              onChange={handleChange('companyType')}
              required
            >
              {companyTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="密码"
              type="password"
              fullWidth
              margin="normal"
              value={form.password}
              onChange={handleChange('password')}
              required
            />
          </Box>

          {/* 第四行：确认密码 */}
          <TextField
            label="确认密码"
            type="password"
            fullWidth
            margin="normal"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
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
            size="large"
          >
            {loading ? "注册中..." : "注册"}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              已有账户？{" "}
              <Link 
                component={RouterLink} 
                to="/login" 
                underline="hover"
              >
                立即登录
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
