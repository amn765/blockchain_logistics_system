import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip
} from "@mui/material";
import { api } from "../../api/http";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: string;
  createdAt: string;
  companyType: string;
  balance: number;
}

export default function Users() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await api.users.getCurrent();
      console.log('获取到的用户信息:', user);
      setUserInfo(user);
    } catch (error) {
      console.error("获取用户信息失败:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount);
  };

  if (!userInfo) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          用户信息
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Typography>加载中...</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        用户信息
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          我的账户
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  联系人
                </Typography>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                  {userInfo.contactPerson}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  邮箱
                </Typography>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                  {userInfo.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  企业名称
                </Typography>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                  {userInfo.companyName}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  账户余额
                </Typography>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' }, color: 'primary.main' }}>
                  {formatCurrency(userInfo.balance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  企业类型
                </Typography>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                  {userInfo.companyType}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  角色
                </Typography>
                <Chip 
                  label={userInfo.role} 
                  color="primary" 
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, padding: '4px 8px' }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  注册时间
                </Typography>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                  {userInfo.createdAt}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            💡 当前为演示版本，所有用户均具有完整操作权限，可以执行新增批次、物流追踪、资金流转等所有功能。
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
