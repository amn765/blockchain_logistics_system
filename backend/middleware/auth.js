const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.header('Authorization');
    
    // 检查是否存在Authorization头
    if (!authHeader) {
      return res.status(401).json({ message: '未提供访问令牌' });
    }
    
    // 检查是否为Bearer Token格式
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '令牌格式无效' });
    }
    
    // 提取token
    const token = authHeader.replace('Bearer ', '');
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // 查找用户
    const user = await User.findById(decoded.userId).select('-password');
    
    // 检查用户是否存在
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    // 将用户信息附加到请求对象
    req.user = user;
    req.userId = decoded.userId;
    
    // 继续执行下一个中间件
    next();
  } catch (error) {
    // 处理token验证错误
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '令牌无效' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期' });
    }
    
    console.error('认证错误:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

module.exports = auth;