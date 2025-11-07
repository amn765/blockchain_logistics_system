const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// 引入模型和中间件
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const contract = require('../fabricMock');

// 获取所有产品 (Protected)
router.get('/', auth, async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAllProducts');
        const products = JSON.parse(result.toString());
        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// 创建新产品 (Protected)
router.post('/', auth, async (req, res) => {
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

// 转移产品 (Protected)
router.put('/:id/transfer', auth, async (req, res) => {
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

// 文件上传路由 (Protected) - 用于上传质检报告
router.post('/upload-file', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
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

module.exports = router;