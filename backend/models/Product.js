// backend/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // 区块链ID (Fabric中的唯一标识)
  id: {
    type: String,
    required: true,
    unique: true,
    index: true // 增加索引
  },
  // 产品名称 (或 SKU)
  name: {
    type: String,
    required: true
  },
  // SKU
  sku: {
    type: String,
    required: true,
    index: true // 增加索引
  },
  // 批次号
  batchNo: {
    type: String,
    required: true,
    index: true // 增加索引
  },
  // 数量
  quantity: {
    type: Number,
    required: true
  },
  // 生产日期
  productionDate: {
    type: String
  },
  // 所有者
  owner: {
    type: String,
    required: true
  },
  // 当前状态 (来自物流)
  status: {
    type: String,
    // 匹配 AddLogisticsEventForm.tsx 和 Logistics/index.tsx
    enum: ['pending', 'received', 'shipped', 'in_transit', 'arrived', 'delivered', 'exception'],
    default: 'pending'
  },
  // 当前位置 (用于物流筛选)
  currentLocation: {
    type: String,
    default: ''
  },
  // 经办方
  currentActor: {
    type: String,
    default: ''
  },
  // 质检报告文件ID (来自 AddBatchForm.tsx)
  gcReportId: {
    type: String,
    default: ''
  },
  // 参考编号 (用于关联金融交易)
  reference: {
    type: String,
    index: true
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
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

productSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Product', productSchema);