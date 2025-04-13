const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// 保護路由的中間件
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 檢查請求頭中的 Authorization token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 取得 token
      token = req.headers.authorization.split(' ')[1];

      // 驗證 token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 獲取用戶資訊（不包含密碼）
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('未找到該使用者');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('未授權，token 無效');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('未授權，沒有提供 token');
  }
});

// 僅允許教師角色訪問的中間件
const teacherOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403);
    throw new Error('未授權，僅限教師訪問');
  }
});

module.exports = { protect, teacherOnly }; 