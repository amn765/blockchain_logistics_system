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

// 获取所有用户列表（仅管理员可用）
// GET /api/users
router.get('/', auth, async (req, res) => {
  try {
    // 检查是否为管理员（这里可以根据需要添加权限检查）
    // const currentUser = req.user;
    // if (currentUser.role !== 'admin') {
    //   return res.status(403).json({ success: false, message: '权限不足' });
    // }

    // 获取所有用户列表（不包含密码）
    const users = await User.find({}, '-password');
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

module.exports = router;