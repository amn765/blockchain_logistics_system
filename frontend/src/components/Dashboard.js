import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalTransactions: 0,
    activeLogistics: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [productsRes] = await Promise.all([
        axios.get('http://localhost:3001/api/products')
      ]);

      const products = productsRes.data;
      setRecentProducts(products.slice(0, 5));

      setStats({
        totalProducts: products.length,
        totalTransactions: 0, // TODO: 实现交易统计
        activeLogistics: 0   // TODO: 实现物流统计
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        仪表板
      </Typography>

      <Grid container spacing={3}>
        {/* 统计卡片 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                产品总数
              </Typography>
              <Typography variant="h5">
                {stats.totalProducts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                交易总数
              </Typography>
              <Typography variant="h5">
                {stats.totalTransactions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                活跃物流
              </Typography>
              <Typography variant="h5">
                {stats.activeLogistics}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 最近产品 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              最近产品
            </Typography>
            <List>
              {recentProducts.map((product) => (
                <ListItem key={product.id} divider>
                  <ListItemText
                    primary={product.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          所有者: {product.owner}
                        </Typography>
                        <Chip
                          label={product.status}
                          size="small"
                          color={product.status === 'created' ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* 系统状态 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              系统状态
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>区块链网络</Typography>
                <Chip label="运行中" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>数据库连接</Typography>
                <Chip label="正常" color="success" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>API服务</Typography>
                <Chip label="运行中" color="success" size="small" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
