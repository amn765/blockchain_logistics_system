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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from "@mui/material";
import { api } from "../../api/http";
import AddBatchForm from "../../components/AddBatchForm";
import AddLogisticsEventForm from "../../components/AddLogisticsEventForm";

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'in_transit', label: '运输中' },
  { value: 'delivered', label: '已送达' },
  { value: 'exception', label: '异常' }
];

export default function Logistics() {
  const [list, setList] = useState<any[]>([]);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // 筛选状态
  const [filters, setFilters] = useState({
    status: 'all',
    location: '',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [list, filters]);

  const loadData = async () => {
    const res = await api.logistics.list();
    // console.log(res)
    setList(res);
  };

  const applyFilters = () => {
    let filtered = [...list];

    // 状态筛选
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // 位置筛选
    if (filters.location) {
      filtered = filtered.filter(item => 
        item.lastLocation.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // 搜索筛选（商品编号和名称）
    if (filters.search) {
      filtered = filtered.filter(item =>
        item.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredList(filtered);
  };

  const handleAddEvent = (product: any) => {
    setSelectedProduct(product);
    setEventFormOpen(true);
  };

  const handleEventSuccess = (newEvent: any) => {
    console.log('事件添加成功:', newEvent);
    // 刷新数据
    loadData();
  };

  const handleAddSuccess = (newProduct: any) => {
    console.log("新批次创建成功:", newProduct);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'in_transit': return 'primary';
      case 'pending': return 'warning';
      case 'exception': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return '已送达';
      case 'in_transit': return '运输中';
      case 'pending': return '待处理';
      case 'exception': return '异常';
      default: return status;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          物流追踪
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setAddFormOpen(true)}
        >
          新增批次
        </Button>
      </Box>

      {/* 筛选器 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          筛选条件
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>状态</InputLabel>
              <Select
                value={filters.status}
                label="状态"
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
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="位置搜索"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              placeholder="输入位置关键词"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="搜索商品"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="输入商品编号或名称"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          共 {filteredList.length} 条记录
        </Typography>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>商品编号</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>最后位置</TableCell>
              <TableCell>经办方</TableCell>
              <TableCell>更新时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredList.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={getStatusText(r.status)} 
                    color={getStatusColor(r.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{r.lastLocation}</TableCell>
                <TableCell>{r.currentActor}</TableCell>
                <TableCell>{r.updatedAt}</TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    onClick={() => alert("查看溯源（占位）")}
                    sx={{ mr: 1 }}
                  >
                    溯源
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => handleAddEvent(r)}
                  >
                    添加事件
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredList.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            暂无数据
          </Typography>
        )}
      </Paper>

      {/* 新增批次弹窗 */}
      <AddBatchForm
        open={addFormOpen}
        onClose={() => setAddFormOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* 添加事件弹窗 */}
      {selectedProduct && (
        <AddLogisticsEventForm
          open={eventFormOpen}
          onClose={() => setEventFormOpen(false)}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onSuccess={handleEventSuccess}
        />
      )}
    </Box>
  );
}
