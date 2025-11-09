const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth'); // 如果你有登录验证中间件
const User = require('../models/User');

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
  const currentTransaction = req.params;
  // console.log('参数为' + req.params)
  try {
    // 根据链码id字段查找（不是MongoDB的_id）
    // console.log(currentTransaction.id)
    const tx = await Transaction.findOne({ id: currentTransaction.id });
    console.log(tx)
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
    
    console.log('付款方为' + tx.from)
    console.log('收款方为' + tx.to)
    // 1. 查找付款方 (User)
    const payer = await User.findOne({ companyName: tx.from });

    console.log('付款方'+payer)
    if (!payer) {
      console.error(`❌ 确认失败：找不到付款方 "${tx.from}"`);
      // 也许应该将交易设为 FAILED
      return res.status(400).json({ message: '付款方账户不存在' });
    }

    // 2. 检查余额
    if (payer.balance < tx.amount) {
      console.warn(`❌ 确认失败：付款方 "${payer.companyName}" 余额不足 (需要 ${tx.amount}, 只有 ${payer.balance})`);
      
      // 将交易状态设为 FAILED
      tx.status = 'FAILED';
      tx.updatedAt = new Date();
      await tx.save();

      return res.status(400).json({ message: '付款方余额不足，交易失败' });
    }

    // 3. 扣除余额并保存付款方
    payer.balance -= tx.amount;
    await payer.save();
    console.log(`✅ 已从 "${payer.companyName}" 扣除 ${tx.amount}。新余额: ${payer.balance}`);

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