const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth'); // 如果你有登录验证中间件

/**
 * 获取所有交易记录
 * GET /api/finance/transactions
 */
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('❌ 获取交易记录失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 确认收款接口
 * POST /api/finance/transactions/:id/confirm
 */
router.post('/transactions/:id/confirm', auth, async (req, res) => {
  const { id } = req.params;
  try {
    // 根据链码id字段查找（不是MongoDB的_id）
    const tx = await Transaction.findOne({ id });
    if (!tx) {
      return res.status(404).json({ message: '交易不存在' });
    }

    // 状态检查
    if (tx.status === 'CONFIRMED') {
      return res.status(400).json({ message: '交易已确认，无需重复操作' });
    }
    if (tx.status === 'FAILED') {
      return res.status(400).json({ message: '失败交易无法确认' });
    }

    // 更新状态
    tx.status = 'CONFIRMED';
    tx.updatedAt = new Date();
    await tx.save();

    console.log(`✅ 交易 ${tx.id} 已确认收款`);
    res.json({
      message: '收款确认成功',
      transaction: tx
    });
  } catch (err) {
    console.error('❌ 确认收款失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * （可选）创建交易记录
 * POST /api/finance/transactions
 */
router.post('/transactions', auth, async (req, res) => {
  try {
    const { id, productId, reference, from, to, amount, currency } = req.body;

    const newTx = new Transaction({
      id,
      productId,
      reference,
      from,
      to,
      amount,
      currency,
      status: 'PENDING',
      timestamp: new Date(),
    });

    await newTx.save();
    console.log(`💰 新交易已创建: ${id}`);

    res.status(201).json(newTx);
  } catch (err) {
    console.error('❌ 创建交易失败:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
