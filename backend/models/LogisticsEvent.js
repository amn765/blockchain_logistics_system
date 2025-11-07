// backend/models/LogisticsRecord.js
const mongoose = require('mongoose');

const logisticsRecordSchema = new mongoose.Schema({
  // 链码上的唯一ID
  id: {
    type: String,
    required: true,
    unique: true
  },
  // 关联的产品ID (对应 Product.id)
  productId: {
    type: String,
    required: true,
    index: true // 增加索引
  },
  // 位置 (来自链码 Location)
  location: {
    type: String,
    required: true
  },
  // 事件状态/类型 (来自链码 Status)
  status: {
    type: String,
    required: true
  },
  // 经办方 (来自链码 Handler)
  handler: {
    type: String,
    required: true
  },
  // 备注 (来自链码 Notes)
  notes: {
    type: String
  },
  // 事件时间戳 (来自链码 Timestamp)
  timestamp: {
    type: Date,
    required: true
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LogisticsRecord', logisticsRecordSchema);