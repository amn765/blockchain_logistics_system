import React, { useState, useEffect } from 'react';
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

const Products = () => {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    id: '',
    name: '',
    description: '',
    owner: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreateProduct = async () => {
    try {
      await axios.post('http://localhost:3001/api/products', newProduct);
      setOpen(false);
      setNewProduct({ id: '', name: '', description: '', owner: '' });
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">产品管理</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          新建产品
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>产品ID</TableCell>
              <TableCell>产品名称</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>所有者</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>创建时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>{product.owner}</TableCell>
                <TableCell>
                  <Chip
                    label={product.status}
                    color={product.status === 'created' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(product.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 新建产品对话框 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新建产品</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="产品ID"
            fullWidth
            value={newProduct.id}
            onChange={(e) => setNewProduct({ ...newProduct, id: e.target.value })}
          />
          <TextField
            margin="dense"
            label="产品名称"
            fullWidth
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="产品描述"
            fullWidth
            multiline
            rows={3}
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="所有者"
            fullWidth
            value={newProduct.owner}
            onChange={(e) => setNewProduct({ ...newProduct, owner: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={handleCreateProduct} variant="contained">创建</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
