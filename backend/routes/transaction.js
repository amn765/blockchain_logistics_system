const express = require('express');
const router = express.Router();

// 引入模型和中间件
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const contract = require('../fabricMock');

// 获取交易列表 (Protected)
router.get('/', auth, async (req, res) => {
  try {
    // 从查询参数获取筛选条件
    const { status, from, to } = req.query;
    
    // 构建查询条件
    const query = {};
    
    // 如果提供了状态筛选
    if (status) {
      query.status = status;
    }
    
    // 如果提供了付款方筛选
    if (from) {
      query.from = from;
    }
    
    // 如果提供了收款方筛选
    if (to) {
      query.to = to;
    }
    
    // 从 MongoDB 读取交易列表
    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 }) // 按时间戳降序排列
      .exec();
    
    // 返回交易列表
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// 创建交易 (Protected)
router.post('/', auth, async (req, res) => {
  try {
    // 1. 获取数据 (来自 CreatePaymentForm.tsx)
    const { toCompanyId, amount, currency, reference, notes } = req.body;
    const fromCompany = req.user.companyName; // 来自 auth 中间件
    const transactionId = `fin-tx-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 2. (模拟) 提交到 Fabric
    // 参数匹配 supplychain.go 的 CreateTransaction
    await contract.submitTransaction(
      'CreateTransaction',
      transactionId,
      reference, // 链码的 'productId' 字段用于 'reference'
      fromCompany,
      toCompanyId, // 假设 'toCompanyId' 是公司名
      amount.toString(),
      currency
    );

    // 3. 真实写入 MongoDB (Transaction 集合)
    const newTransaction = new Transaction({
      id: transactionId,
      productId: reference, // 使用 reference 作为 productId
      reference: reference,
      from: fromCompany,
      to: toCompanyId,
      amount: amount,
      currency: currency,
      status: 'PENDING', // 初始状态
      timestamp: new Date(timestamp)
    });
    await newTransaction.save();

    // 4. 返回前端 CreatePaymentForm.tsx 期望的结构
    res.status(201).json({
      transactionId: newTransaction.id,
      ledgerTxId: `tx-mock-${Date.now()}`,
      status: newTransaction.status,
      ...newTransaction.toObject()
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

module.exports = router;