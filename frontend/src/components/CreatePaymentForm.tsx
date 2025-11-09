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

// 模拟合作公司
const partnerCompanies = [
  { id: "A", name: "A公司" },
  { id: "B", name: "B公司" },
  { id: "C", name: "C公司" },
  { id: "D", name: "D公司" },
  { id: "E", name: "E公司" }
];

interface CreatePaymentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newTransaction: any) => void;
}

export default function CreatePaymentForm({ open, onClose, onSuccess }: CreatePaymentFormProps) {
  const [form, setForm] = useState({
    toCompanyId: "",
    amount: "",
    currency: "CNY",
    reference: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 简单验证
    if (!form.payee || !form.amount || !form.reference) {
      setError('请填写必填字段');
      return;
    }

    if (parseFloat(form.amount) <= 0) {
      setError('金额必须大于0');
      return;
    }

    setLoading(true);

    try {
      const result = await api.finance.createTransaction({
        toCompanyId: form.payee,
        amount: parseFloat(form.amount),
        currency: form.currency,
        reference: form.reference,
        notes: form.notes || undefined
      });

      onSuccess(result);
      handleClose();
      
    } catch (err: any) {
      setError(err.message || '发起支付失败');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      toCompanyId: "",
      amount: "",
      currency: "CNY",
      reference: "",
      notes: ""
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>发起支付</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="收款方"
              fullWidth
              value={form.payee}
              onChange={(e) => setForm({ ...form, payee: e.target.value })}
              placeholder="请输入收款公司名称"
            />

            <TextField
              required
              label="金额"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="请输入金额"
            />

            <FormControl fullWidth>
              <InputLabel>币种</InputLabel>
              <Select
                value={form.currency}
                label="币种"
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <MenuItem value="CNY">人民币 (CNY)</MenuItem>
                <MenuItem value="USD">美元 (USD)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              required
              label="商品编号"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="例如：INV-202501001"
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
            {loading ? "提交中..." : "发起支付"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
