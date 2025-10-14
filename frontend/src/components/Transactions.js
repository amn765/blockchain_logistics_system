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

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    id: '',
    productId: '',
    from: '',
    to: '',
    amount: '',
    currency: 'CNY'
  });

  const handleCreateTransaction = async () => {
    try {
      await axios.post('http://localhost:3001/api/transactions', {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      });
      setOpen(false);
      setNewTransaction({
        id: '',
        productId: '',
        from: '',
        to: '',
        amount: '',
        currency: 'CNY'
      });
      // TODO: 重新获取交易列表
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">资金流转</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          新建交易
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>交易ID</TableCell>
              <TableCell>产品ID</TableCell>
              <TableCell>付款方</TableCell>
              <TableCell>收款方</TableCell>
              <TableCell>金额</TableCell>
              <TableCell>货币</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.id}</TableCell>
                <TableCell>{transaction.productId}</TableCell>
                <TableCell>{transaction.from}</TableCell>
                <TableCell>{transaction.to}</TableCell>
                <TableCell>{transaction.amount}</TableCell>
                <TableCell>{transaction.currency}</TableCell>
                <TableCell>
                  <Chip
                    label={transaction.status}
                    color={transaction.status === 'completed' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{transaction.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 新建交易对话框 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新建交易</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="交易ID"
            fullWidth
            value={newTransaction.id}
            onChange={(e) => setNewTransaction({ ...newTransaction, id: e.target.value })}
          />
          <TextField
            margin="dense"
            label="产品ID"
            fullWidth
            value={newTransaction.productId}
            onChange={(e) => setNewTransaction({ ...newTransaction, productId: e.target.value })}
          />
          <TextField
            margin="dense"
            label="付款方"
            fullWidth
            value={newTransaction.from}
            onChange={(e) => setNewTransaction({ ...newTransaction, from: e.target.value })}
          />
          <TextField
            margin="dense"
            label="收款方"
            fullWidth
            value={newTransaction.to}
            onChange={(e) => setNewTransaction({ ...newTransaction, to: e.target.value })}
          />
          <TextField
            margin="dense"
            label="金额"
            type="number"
            fullWidth
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
          />
          <TextField
            margin="dense"
            label="货币"
            fullWidth
            value={newTransaction.currency}
            onChange={(e) => setNewTransaction({ ...newTransaction, currency: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={handleCreateTransaction} variant="contained">创建</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions;
