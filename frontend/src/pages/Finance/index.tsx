  import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from "@mui/material";
import { api } from "../../api/http";
import CreatePaymentForm from "../../components/CreatePaymentForm";

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'PENDING', label: '处理中' },
  { value: 'CONFIRMED', label: '已确认' },
  { value: 'FAILED', label: '失败' }
];

export default function Finance() {
  const [txs, setTxs] = useState<any[]>([]);
  const [filteredTxs, setFilteredTxs] = useState<any[]>([]);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [txs, filters]);

  const loadData = async () => {
    const res = await api.finance.transactions();
    console.log('获取到的交易:', res);
    setTxs(res);
  };

  const applyFilters = () => {
    let filtered = [...txs];

    // 状态筛选
    if (filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    setFilteredTxs(filtered);
  };

  const handlePaymentSuccess = (newTransaction: any) => {
    console.log('支付发起成功:', newTransaction);
    // 刷新数据
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return '已确认';
      case 'PENDING': return '处理中';
      case 'FAILED': return '失败';
      default: return status;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleConfirmPayment = async (txId: string) => {
    if (!window.confirm(`确认已收到交易 ${txId} 的资金吗？`)) return;
    try {
      const res = await api.finance.confirmTransaction(txId); // 调后端接口
      console.log('确认收款成功:', res);
      alert('确认成功 ✅');
      loadData(); // 刷新数据
    } catch (err) {
      console.error('确认收款失败:', err);
      alert('确认失败 ❌');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          资金流转
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setPaymentFormOpen(true)}
        >
          发起支付
        </Button>
      </Box>

      {/* 筛选器 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>状态筛选</InputLabel>
              <Select
                value={filters.status}
                label="状态筛选"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={9}>
            <Typography variant="body2" color="text.secondary">
              共 {filteredTxs.length} 笔交易
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>交易哈希</TableCell>
              <TableCell>金额</TableCell>
              <TableCell>付款方</TableCell>
              <TableCell>收款方</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>参考编号</TableCell>
              <TableCell>日期</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTxs.map((t) => (
              <TableRow key={t.id}>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {t.id}
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="bold">
                    {formatAmount(t.amount, t.currency)}
                  </Typography>
                </TableCell>
                <TableCell>{t.payer}</TableCell>
                <TableCell>{t.payee}</TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(t.status)} 
                    color={getStatusColor(t.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{t.reference}</TableCell>
                <TableCell>{t.date}</TableCell>
                <TableCell>
                  {/* ✅ 新增确认按钮 */}
                  <Button
                    size="small"
                    onClick={() => handleConfirmPayment(t.id)}
                  >
                    确认收款
                  </Button>
                  {t.status === 'CONFIRMED' && (
                    <Button size="small" disabled>已确认</Button>
                  )}
                  {t.status === 'FAILED' && (
                    <Button size="small" disabled color="error">失败</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredTxs.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            暂无交易记录
          </Typography>
        )}
      </Paper>

      {/* 发起支付弹窗 */}
      <CreatePaymentForm
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </Box>
  );
}
