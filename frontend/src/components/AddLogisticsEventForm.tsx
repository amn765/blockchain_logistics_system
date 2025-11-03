import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { api } from "../api/http";

// 事件类型选项
const eventTypes = [
  { value: 'received', label: '收货入库' },
  { value: 'shipped', label: '发货出库' },
  { value: 'in_transit', label: '运输中' },
  { value: 'arrived', label: '到达中转' },
  { value: 'delivered', label: '已送达' },
  { value: 'exception', label: '异常情况' }
];

interface AddLogisticsEventFormProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSuccess: (newEvent: any) => void;
}

export default function AddLogisticsEventForm({ 
  open, 
  onClose, 
  productId, 
  productName,
  onSuccess 
}: AddLogisticsEventFormProps) {
  const [form, setForm] = useState({
    type: '',
    location: '',
    actor: '',
    timestamp: new Date().toISOString().slice(0, 16), // 默认当前时间
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 简单验证
    if (!form.type || !form.location || !form.actor) {
      setError('请填写必填字段');
      return;
    }

    setLoading(true);

    try {
      const result = await api.logisticsEvents.addEvent(productId, {
        type: form.type,
        location: form.location,
        actor: form.actor,
        timestamp: new Date(form.timestamp).toISOString(),
        notes: form.notes || undefined
      });

      onSuccess(result);
      handleClose();
      
    } catch (err: any) {
      setError(err.message || '添加事件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      type: '',
      location: '',
      actor: '',
      timestamp: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        添加物流事件 - {productName}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>事件类型</InputLabel>
              <Select
                value={form.type}
                label="事件类型"
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {eventTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              required
              label="位置"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="例如：上海仓库、北京分拨中心"
            />

            <TextField
              required
              label="经办方"
              value={form.actor}
              onChange={(e) => setForm({ ...form, actor: e.target.value })}
              placeholder="例如：张三、物流公司A"
            />

            <TextField
              label="时间"
              type="datetime-local"
              value={form.timestamp}
              onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="备注"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="可选备注信息"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? "提交中..." : "添加事件"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
