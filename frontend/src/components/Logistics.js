import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Chip
} from '@mui/material';
import axios from 'axios';

const Logistics = () => {
  const [logistics, setLogistics] = useState([]);
  const [open, setOpen] = useState(false);
  const [newLogistics, setNewLogistics] = useState({
    id: '',
    productId: '',
    location: '',
    status: 'in_transit',
    handler: '',
    notes: ''
  });

  const handleUpdateLogistics = async () => {
    try {
      await axios.post('http://localhost:3001/api/logistics', newLogistics);
      setOpen(false);
      setNewLogistics({
        id: '',
        productId: '',
        location: '',
        status: 'in_transit',
        handler: '',
        notes: ''
      });
      // TODO: 重新获取物流列表
    } catch (error) {
      console.error('Error updating logistics:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_transit': return 'warning';
      case 'delivered': return 'success';
      case 'delayed': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_transit': return '运输中';
      case 'delivered': return '已交付';
      case 'delayed': return '延误';
      default: return status;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">物流追踪</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          更新物流信息
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>记录ID</TableCell>
              <TableCell>产品ID</TableCell>
              <TableCell>当前位置</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>处理人</TableCell>
              <TableCell>备注</TableCell>
              <TableCell>时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logistics.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.id}</TableCell>
                <TableCell>{record.productId}</TableCell>
                <TableCell>{record.location}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(record.status)}
                    color={getStatusColor(record.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{record.handler}</TableCell>
                <TableCell>{record.notes}</TableCell>
                <TableCell>{record.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 更新物流对话框 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>更新物流信息</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="记录ID"
            fullWidth
            value={newLogistics.id}
            onChange={(e) => setNewLogistics({ ...newLogistics, id: e.target.value })}
          />
          <TextField
            margin="dense"
            label="产品ID"
            fullWidth
            value={newLogistics.productId}
            onChange={(e) => setNewLogistics({ ...newLogistics, productId: e.target.value })}
          />
          <TextField
            margin="dense"
            label="当前位置"
            fullWidth
            value={newLogistics.location}
            onChange={(e) => setNewLogistics({ ...newLogistics, location: e.target.value })}
          />
          <TextField
            margin="dense"
            label="状态"
            select
            fullWidth
            value={newLogistics.status}
            onChange={(e) => setNewLogistics({ ...newLogistics, status: e.target.value })}
            SelectProps={{
              native: true,
            }}
          >
            <option value="in_transit">运输中</option>
            <option value="delivered">已交付</option>
            <option value="delayed">延误</option>
          </TextField>
          <TextField
            margin="dense"
            label="处理人"
            fullWidth
            value={newLogistics.handler}
            onChange={(e) => setNewLogistics({ ...newLogistics, handler: e.target.value })}
          />
          <TextField
            margin="dense"
            label="备注"
            fullWidth
            multiline
            rows={3}
            value={newLogistics.notes}
            onChange={(e) => setNewLogistics({ ...newLogistics, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={handleUpdateLogistics} variant="contained">更新</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Logistics;
