import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip
} from "@mui/material";
import { api } from "../../api/http";

// 交易记录类型定义
interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  from: string;
  to: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    (async () => {
      // 并行获取仪表盘数据和交易记录
      const [summaryRes, transactionsRes] = await Promise.all([
        api.dashboard.summary(),
        api.dashboard.recentTransactions()
      ]);
      setData(summaryRes);
      setTransactions(transactionsRes);
    })();
  }, []);

  // 状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // 状态标签文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'pending': return '处理中';
      case 'failed': return '失败';
      default: return status;
    }
  };

  // 格式化金额显示
  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}¥${amount.toLocaleString()}`;
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        仪表盘
      </Typography>

      {/* 核心指标卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">在途商品</Typography>
            <Typography variant="h4">{data?.totalShipments ?? "-"}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">活跃订单</Typography>
            <Typography variant="h4">{data?.activeOrders ?? "-"}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">待结算</Typography>
            <Typography variant="h4">{data?.pendingPayments ?? "-"}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">链上交易数</Typography>
            <Typography variant="h4">{data?.onChainTxCount ?? "-"}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 最近交易记录表格 */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          最近交易记录
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>交易ID</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>金额</TableCell>
                <TableCell>交易方</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>日期</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell 
                    sx={{ 
                      color: transaction.type === 'income' ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatAmount(transaction.amount, transaction.type)}
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'income' ? `来自: ${transaction.from}` : `支付给: ${transaction.to}`}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(transaction.status)} 
                      color={getStatusColor(transaction.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {transactions.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            暂无交易记录
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
