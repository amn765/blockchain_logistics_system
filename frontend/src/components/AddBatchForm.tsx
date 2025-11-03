import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { api } from "../api/http";

interface AddBatchFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newProduct: any) => void;
}

export default function AddBatchForm({ open, onClose, onSuccess }: AddBatchFormProps) {
  const [form, setForm] = useState({
    sku: "",
    batchNo: "",
    quantity: 100,
    productionDate: "",
    origin: "",
    temperatureRecord: "",
    gcReport: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let gcReportId = undefined;

      // 如果有上传文件，先上传文件
      if (form.gcReport) {
        const uploadResult = await api.products.uploadFile(form.gcReport);
        gcReportId = uploadResult.fileId;
      }

      // 创建商品批次
      const result = await api.products.create({
        sku: form.sku,
        batchNo: form.batchNo,
        quantity: form.quantity,
        productionDate: form.productionDate,
        metadata: {
          origin: form.origin || undefined,
          temperatureRecord: form.temperatureRecord || undefined,
          gcReportId
        }
      });

      setSuccessData(result);
      onSuccess(result);
      
    } catch (err: any) {
      setError(err.message || "创建批次失败");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, gcReport: e.target.files[0] });
    }
  };

  const handleClose = () => {
    setForm({
      sku: "",
      batchNo: "",
      quantity: 100,
      productionDate: "",
      origin: "",
      temperatureRecord: "",
      gcReport: null
    });
    setError(null);
    setSuccessData(null);
    onClose();
  };

  if (successData) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>批次创建成功</DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            商品批次已成功创建并提交上链！
          </Alert>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="body2"><strong>商品ID:</strong> {successData.productId}</Typography>
            <Typography variant="body2"><strong>链上交易ID:</strong> {successData.ledgerTxId}</Typography>
            <Typography variant="body2"><strong>状态:</strong> {successData.status}</Typography>
            <Typography variant="body2"><strong>二维码数据:</strong> {successData.qrCodeData}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>关闭</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>新增商品批次</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              required
              label="商品SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              required
              label="批次号"
              value={form.batchNo}
              onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              required
              label="数量"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <TextField
              required
              label="生产日期"
              type="date"
              value={form.productionDate}
              onChange={(e) => setForm({ ...form, productionDate: e.target.value })}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="生产地"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="温度记录"
              value={form.temperatureRecord}
              onChange={(e) => setForm({ ...form, temperatureRecord: e.target.value })}
              fullWidth
              margin="normal"
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              质检报告上传
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              选择文件
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.png,.doc,.docx"
                onChange={handleFileChange}
              />
            </Button>
            {form.gcReport && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                已选择: {form.gcReport.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? "提交中..." : "创建批次"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
