const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const LogisticsRecord = require('../models/LogisticsEvent');
const Transaction = require('../models/Transaction');

// 溯源查询接口
// GET /api/trace/search
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: 'Query parameter is required' 
      });
    }

    // 根据不同的查询条件进行搜索
    let products = [];
    
    // 如果是产品ID或SKU或批次号，直接查找产品
    products = await Product.find({
      $or: [
        { id: query },
        { sku: query },
        { batchNo: query },
        { reference: query }
      ]
    }).lean();

    // 如果没有找到产品，尝试通过物流记录或交易记录查找相关产品
    if (products.length === 0) {
      // 通过物流记录查找相关产品
      const logisticsRecords = await LogisticsRecord.find({
        $or: [
          { id: query },
          { productId: query }
        ]
      }).lean();
      
      if (logisticsRecords.length > 0) {
        const productIds = [...new Set(logisticsRecords.map(record => record.productId))];
        products = await Product.find({
          id: { $in: productIds }
        }).lean();
      }
      
      // 如果仍然没有找到产品，通过交易记录查找
      if (products.length === 0) {
        const transactions = await Transaction.find({
          $or: [
            { id: query },
            { productId: query },
            { reference: query }
          ]
        }).lean();
        
        if (transactions.length > 0) {
          const productIds = [...new Set(transactions.map(transaction => transaction.productId))];
          products = await Product.find({
            id: { $in: productIds }
          }).lean();
        }
      }
    }

    // 为每个产品获取相关的物流记录和交易记录
    const traceData = await Promise.all(products.map(async (product) => {
      // 获取产品的物流记录
      const logisticsRecords = await LogisticsRecord.find({ productId: product.id })
        .sort({ timestamp: 1 })
        .lean();
      
      // 获取产品的交易记录
      const transactions = await Transaction.find({ productId: product.id })
        .sort({ timestamp: -1 })
        .lean();
      
      return {
        product,
        logisticsRecords,
        transactions
      };
    }));

    res.json({
      success: true,
      data: traceData
    });
  } catch (error) {
    console.error('溯源查询失败:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;