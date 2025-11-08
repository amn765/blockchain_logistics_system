// backend/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // 链码上的唯一ID
  id: {
    type: String,
    required: true,
    unique: true
  },
  // 关联的产品ID (来自链码 ProductID)
  productId: {
    type: String,
    required: true,
    index: true // 增加索引
  },
  // 参考编号 (用于溯源 和支付)
  reference: {
    type: String,
    index: true
  },
  // 付款方 (来自链码 From)
  from: {
    type: String,
    required: true
  },
  // 收款方 (来自链码 To)
  to: {
    type: String,
    required: true
  },
  // 金额 (来自链码 Amount)
  amount: {
    type: Number,
    required: true
  },
  // 货币 (来自链码 Currency)
  currency: {
    type: String,
    required: true
  },
  // 交易状态 (匹配 Finance/index.tsx)
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'PENDING'
  },
  // 交易时间戳 (来自链码 Timestamp)
  timestamp: {
    type: Date,
    required: true
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时间戳的中间件
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

transactionSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);