const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const LogisticsRecord = require('../models/LogisticsEvent');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// 仪表盘摘要接口
// GET /api/dashboard/summary
router.get('/summary', auth, async (req, res) => {
  try {
    // 获取各种统计数据
    const productCount = await Product.countDocuments();
    const logisticsEventCount = await LogisticsRecord.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    const userCount = await User.countDocuments();
    
    // 获取产品状态分布
    const productStatusDistribution = await Product.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 获取最近7天的产品创建数量
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentProducts = await Product.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // 获取最近7天的物流事件数量
    const recentLogisticsEvents = await LogisticsRecord.countDocuments({
      timestamp: { $gte: sevenDaysAgo }
    });
    
    // 获取最近7天的交易数量
    const recentTransactions = await Transaction.countDocuments({
      timestamp: { $gte: sevenDaysAgo }
    });
    
    // 获取交易状态分布
    const transactionStatusDistribution = await Transaction.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 构造响应数据
    const summary = {
      products: {
        total: productCount,
        recent: recentProducts,
        statusDistribution: productStatusDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      logistics: {
        total: logisticsEventCount,
        recent: recentLogisticsEvents
      },
      transactions: {
        total: transactionCount,
        recent: recentTransactions,
        statusDistribution: transactionStatusDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      users: {
        total: userCount
      }
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('获取仪表盘摘要失败:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// 获取最近的交易记录
// GET /api/dashboard/transactions
router.get('/transactions', auth, async (req, res) => {
  try {
    // 从 Transaction 集合中查找最新的 15 条记录
    const recentTransactions = await Transaction.find()
      .sort({ timestamp: -1 }) // 按时间戳降序排列
      .limit(15) // 限制为15条记录
      .lean(); // 使用lean()提高性能
    
    res.json({
      success: true,
      data: recentTransactions
    });
  } catch (error) {
    console.error('获取最近交易记录失败:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;