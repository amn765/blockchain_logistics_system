const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true
  },
  companyType: {
    type: String,
    required: true,
    enum: ['manufacturer', 'distributor', 'retailer', 'service']
  }
}, {
  timestamps: true
});

// 在保存用户前对密码进行哈希处理
userSchema.pre('save', async function (next) {
  // 只有当密码被修改时才进行哈希处理
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // 生成盐值并哈希密码
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 添加验证密码的方法
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);