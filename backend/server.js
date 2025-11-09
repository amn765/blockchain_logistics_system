const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const logisticsRoutes = require('./routes/logistics');
const transactionRoutes = require('./routes/transaction');
const userRoutes = require('./routes/user');
const traceRoutes = require('./routes/trace');
const dashboardRoutes = require('./routes/dashboard'); // 添加这一行
const financeRoutes = require('./routes/finance'); 
const auth = require('./middleware/auth')
require('dotenv').config();

// 模型
const User = require('./models/User');
const Product = require('./models/Product');
const LogisticsRecord = require('./models/LogisticsEvent');
const Transaction = require('./models/Transaction');

// 文件上传
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // 配置 multer 用于文件上传

// 静态文件服务
const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supplychain', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Hyperledger Fabric connection
let gateway;
let network;
let contract;
contract = require('./fabricMock');

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Supply Chain API is running' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// User routes (Protected)
app.use('/api/users', userRoutes);

// Product routes (Protected)
app.use('/api/products', productRoutes);

// Logistics routes (Protected)
app.use('/api/logistics', logisticsRoutes);

// Transaction routes (Protected)
app.use('/api/transactions', transactionRoutes);

app.use('/api/finance', financeRoutes);

// Trace routes (Protected)
app.use('/api/trace', traceRoutes); // 添加这一行

// Dashboard routes (Protected)
app.use('/api/dashboard', dashboardRoutes); // 添加这一行

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (gateway) {
        await gateway.disconnect();
    }
    process.exit(0);
});