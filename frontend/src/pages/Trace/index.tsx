import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  Grid,
  Divider
} from "@mui/material";
import { api } from "../../api/http";

// 事件类型映射
const eventTypeMap: { [key: string]: string } = {
  received: '收货入库',
  shipped: '发货出库', 
  in_transit: '运输中',
  arrived: '到达中转',
  delivered: '已送达',
  exception: '异常情况'
};

// 状态颜色映射
const statusColorMap: { [key: string]: any } = {
  delivered: 'success',
  in_transit: 'primary', 
  pending: 'warning',
  exception: 'error'
};

// 状态文本映射  
const statusTextMap: { [key: string]: string } = {
  delivered: '已送达',
  in_transit: '运输中',
  pending: '待处理',
  exception: '异常'
};

export default function Trace() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [traceData, setTraceData] = useState<any>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("请输入搜索内容");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.trace.search(query);
      setTraceData(result);
    } catch (err: any) {
      setError(err.message || "搜索失败");
      setTraceData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 合并时间轴数据
  const mergedTimeline = React.useMemo(() => {
    if (!traceData) return [];
    
    const allEvents = [
      ...traceData.events.map((event: any) => ({
        ...event,
        type: 'logistics',
        displayTime: new Date(event.timestamp).toLocaleString('zh-CN')
      })),
      ...traceData.transactions.map((tx: any) => ({
        ...tx,
        type: 'transaction', 
        displayTime: new Date(tx.timestamp).toLocaleString('zh-CN')
      }))
    ];
    
    return allEvents.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [traceData]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        溯源查询
      </Typography>

      {/* 搜索栏 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          查询商品流与资金流
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="输入批次号、SKU、二维码或参考编号"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例如：BATCH-20250115-001、SKU-001、ORDER-20250115-001"
            disabled={loading}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            {loading ? "查询中..." : "搜索"}
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          支持搜索：批次号、SKU、二维码、生产日期、参考编号等
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {traceData && (
        <Box>
          {/* 商品基本信息 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              商品信息
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">商品名称</Typography>
                <Typography variant="body1">{traceData.product.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">批次号</Typography>
                <Typography variant="body1">{traceData.product.batchNo}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">SKU</Typography>
                <Typography variant="body1">{traceData.product.sku}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">数量</Typography>
                <Typography variant="body1">{traceData.product.quantity} 件</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">生产日期</Typography>
                <Typography variant="body1">{traceData.product.productionDate}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">状态</Typography>
                <Chip 
                  label={statusTextMap[traceData.product.status] || traceData.product.status}
                  color={statusColorMap[traceData.product.status] || 'default'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">参考编号</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {traceData.product.reference}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* 合并时间轴 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              完整时间轴
            </Typography>
            
            {mergedTimeline.map((item: any, index: number) => (
              <Box key={item.id} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Chip 
                    label={item.type === 'logistics' ? '物流' : '资金'} 
                    color={item.type === 'logistics' ? 'primary' : 'secondary'}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.displayTime}
                  </Typography>
                </Box>
                
                {item.type === 'logistics' ? (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {eventTypeMap[item.type] || item.type}
                      </Typography>
                      <Typography variant="body2">
                        <strong>位置：</strong>{item.location}
                      </Typography>
                      <Typography variant="body2">
                        <strong>经办方：</strong>{item.actor}
                      </Typography>
                      {item.notes && (
                        <Typography variant="body2">
                          <strong>备注：</strong>{item.notes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {item.description}
                      </Typography>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {formatAmount(item.amount, item.currency)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>付款方：</strong>{item.fromCompany}
                      </Typography>
                      <Typography variant="body2">
                        <strong>收款方：</strong>{item.toCompany}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        <strong>交易哈希：</strong>{item.txId}
                      </Typography>
                      <Chip 
                        label={item.status === 'CONFIRMED' ? '已确认' : item.status}
                        color={item.status === 'CONFIRMED' ? 'success' : 'default'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {index < mergedTimeline.length - 1 && (
                  <Divider sx={{ my: 2 }} />
                )}
              </Box>
            ))}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
