const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// 获取当前用户信息
// GET /api/users/current
router.get('/current', auth, async (req, res) => {
  try {
    // 从 auth 中间件获取的 req.user 中提取用户信息
    const user = req.user;
    
    // 返回用户信息（不包含密码）
    res.json({
      success: true,
      data: {
        id: user._id,
        companyName: user.companyName,
        contactPerson: user.contactPerson,
        email: user.email,
        licenseNumber: user.licenseNumber,
        companyType: user.companyType,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

module.exports = router;