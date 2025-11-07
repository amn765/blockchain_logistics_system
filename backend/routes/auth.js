const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register - 企业注册
router.post('/register', async (req, res) => {
  try {
    const { companyName, contactPerson, email, password, licenseNumber, companyType } = req.body;

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 创建新用户
    const user = new User({
      companyName,
      contactPerson,
      email,
      password,
      licenseNumber,
      companyType
    });

    // 保存用户到数据库（pre('save')钩子会自动哈希密码）
    await user.save();

    // 创建JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    // 返回token和用户信息
    res.status(201).json({
      token,
      user: {
        id: user.id,
        companyName: user.companyName,
        contactPerson: user.contactPerson,
        email: user.email,
        licenseNumber: user.licenseNumber,
        companyType: user.companyType
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '不存在该用户' });
    }

    // 比较密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '密码错误' });
    }

    // 创建JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    // 返回token和用户信息
    res.json({
      token,
      user: {
        id: user.id,
        companyName: user.companyName,
        contactPerson: user.contactPerson,
        email: user.email,
        licenseNumber: user.licenseNumber,
        companyType: user.companyType
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

module.exports = router;