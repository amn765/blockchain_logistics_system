const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const { Gateway, Wallets } = require('fabric-network');
// const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const auth = require('./middleware/auth')
require('dotenv').config();

// 模型
const User = require('./models/User');
const Product = require('./models/Product');
const LogisticsRecord = require('./models/LogisticsRecord');
const Transaction = require('./models/Transaction');

// 文件上传
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // 配置 multer 用于文件上传
const path = require('path'); // 用于服务静态文件

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const app = express();
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
/*
async function connectToFabric() {
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '../blockchain/organizations/peerOrganizations/manufacturer.supplychain.com/connection-manufacturer.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node
        gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to
        network = await gateway.getNetwork('supplychainchannel');

        // Get the contract from the network
        contract = network.getContract('supplychain');

        console.log('Connected to Fabric network');
    } catch (error) {
        console.error(`Failed to connect to Fabric network: ${error}`);
    }
}

// Initialize Fabric connection
connectToFabric();
*/
// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Supply Chain API is running' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Product routes (Protected)
app.get('/api/products', auth, async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllProducts');
        const products = JSON.parse(result.toString());
        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// 替换原有的 POST /api/products 路由
app.post('/api/products', auth, async (req, res) => {
    try {
        // 1. 从 req.body 获取数据 (匹配 AddBatchForm.tsx)
        const { sku, batchNo, quantity, productionDate, metadata, reference } = req.body;
        const owner = req.user.companyName; // 来自 auth 中间件
        const productId = `prod-${batchNo || Date.now()}`; // 生成唯一ID

        // 2. (模拟) 提交到 Fabric
        // 参数匹配 supplychain.go 的 CreateProduct
        await contract.submitTransaction(
            'CreateProduct',
            productId,
            sku, // 对应链码的 'name'
            metadata.origin || 'N/A', // 对应链码的 'description'
            owner
        );

        // 3. 真实写入 MongoDB (使用你的 Product 模型)
        const newProduct = new Product({
            id: productId,
            name: sku, // (或另一个字段, 确保与模型匹配)
            sku: sku,
            batchNo: batchNo,
            quantity: quantity,
            productionDate: productionDate,
            owner: owner,
            status: 'pending', // 初始状态
            currentLocation: metadata.origin || 'Factory',
            currentActor: owner,
            gcReportId: metadata.gcReportId,
            reference: reference // 用于关联订单
        });
        await newProduct.save();

        // 4. 返回前端 AddBatchForm.tsx 期望的结构
        res.status(201).json({
            productId: newProduct.id,
            ledgerTxId: `tx-mock-${Date.now()}`,
            status: newProduct.status,
            qrCodeData: `PRODUCT-${sku}-${batchNo}`
        });

    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id/transfer', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { newOwner } = req.body;
        await contract.submitTransaction('TransferProduct', id, newOwner);
        res.json({ message: 'Product transferred successfully' });
    } catch (error) {
        console.error('Error transferring product:', error);
        res.status(500).json({ error: 'Failed to transfer product' });
    }
});

// Transaction routes (Protected)
app.post('/api/transactions', auth, async (req, res) => {
    try {
        const { id, productId, from, to, amount, currency } = req.body;
        await contract.submitTransaction('CreateTransaction', id, productId, from, to, amount.toString(), currency);
        res.json({ message: 'Transaction created successfully' });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// Logistics routes (Protected)
app.post('/api/logistics', auth, async (req, res) => {
    try {
        const { id, productId, location, status, handler, notes } = req.body;
        await contract.submitTransaction('UpdateLogisticsRecord', id, productId, location, status, handler, notes);
        res.json({ message: 'Logistics record updated successfully' });
    } catch (error) {
        console.error('Error updating logistics:', error);
        res.status(500).json({ error: 'Failed to update logistics record' });
    }
});

// 文件上传路由 (Protected) - 用于上传质检报告
app.post('/api/products/upload-file', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {// Product routes (Protected)
app.get('/api/products', auth, async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllProducts');
        const products = JSON.parse(result.toString());
        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// 替换原有的 POST /api/products 路由
app.post('/api/products', auth, async (req, res) => {
    try {
        // 1. 从 req.body 获取数据 (匹配 AddBatchForm.tsx)
        const { sku, batchNo, quantity, productionDate, metadata, reference } = req.body;
        const owner = req.user.companyName; // 来自 auth 中间件
        const productId = `prod-${batchNo || Date.now()}`; // 生成唯一ID

        // 2. (模拟) 提交到 Fabric
        // 参数匹配 supplychain.go 的 CreateProduct
        await contract.submitTransaction(
            'CreateProduct',
            productId,
            sku, // 对应链码的 'name'
            metadata.origin || 'N/A', // 对应链码的 'description'
            owner
        );

        // 3. 真实写入 MongoDB (使用你的 Product 模型)
        const newProduct = new Product({
            id: productId,
            name: sku, // (或另一个字段, 确保与模型匹配)
            sku: sku,
            batchNo: batchNo,
            quantity: quantity,
            productionDate: productionDate,
            owner: owner,
            status: 'pending', // 初始状态
            currentLocation: metadata.origin || 'Factory',
            currentActor: owner,
            gcReportId: metadata.gcReportId,
            reference: reference // 用于关联订单
        });
        await newProduct.save();

        // 4. 返回前端 AddBatchForm.tsx 期望的结构
        res.status(201).json({
            productId: newProduct.id,
            ledgerTxId: `tx-mock-${Date.now()}`,
            status: newProduct.status,
            qrCodeData: `PRODUCT-${sku}-${batchNo}`
        });

    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id/transfer', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { newOwner } = req.body;
        await contract.submitTransaction('TransferProduct', id, newOwner);
        res.json({ message: 'Product transferred successfully' });
    } catch (error) {
        console.error('Error transferring product:', error);
        res.status(500).json({ error: 'Failed to transfer product' });
    }
});

            return res.status(400).json({ error: '没有上传文件' });
        }

        // 返回文件信息
        res.json({
            fileId: req.file.filename,  // 使用 multer 生成的文件名作为 fileId
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            url: `/uploads/${req.file.filename}`  // 文件访问路径
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({ error: '文件上传失败' });
    }
});

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