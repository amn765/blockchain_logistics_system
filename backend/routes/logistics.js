const express = require('express');
const router = express.Router();

// 引入模型和中间件
const LogisticsRecord = require('../models/LogisticsEvent');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
// const contract = require('../fabricMock');
const contract = require('../fabricReal');

// 添加物流事件 (Protected)
router.post('/', auth, async (req, res) => {
  try {
    // 1. 获取数据 (来自 AddLogisticsEventForm.tsx)
    const { productId, type, location, actor, timestamp, notes } = req.body;
    const recordId = `log-evt-${Date.now()}`;

    // 2. (模拟) 提交到 Fabric
    // 参数匹配 supplychain.go 的 UpdateLogisticsRecord
    await contract.submitTransaction(
      'UpdateLogisticsRecord',
      recordId,
      productId,
      location,
      type, // 链码的 'status' 字段对应前端的 'type'
      actor, // 链码的 'handler'
      notes || ''
    );

    // 3. 写入 MongoDB (创建新物流记录)
    const newRecord = new LogisticsRecord({
      id: recordId,
      productId: productId,
      location: location,
      status: type,
      timestamp: timestamp,
      handler: actor,
      notes: notes
    });
    await newRecord.save();

    // 4. (重要) 更新 MongoDB 中 Product 的状态
    await Product.findOneAndUpdate(
      { id: productId },
      {
        status: type, // 更新为最新的物流状态
        currentLocation: location,
        currentActor: actor,
        updatedAt: Date.now()
      }
    );

    // 5. 返回前端 AddLogisticsEventForm.tsx 期望的结构
    res.status(201).json({
      eventId: newRecord.id,
      ledgerTxId: `tx-mock-${Date.now()}`,
      status: "PENDING",
      ...newRecord.toObject()
    });

  } catch (error) {
    console.error('Error updating logistics:', error);
    res.status(500).json({ error: 'Failed to update logistics record' });
  }
});

module.exports = router;