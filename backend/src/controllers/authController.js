const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    註冊新用戶
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // 檢查用戶是否已存在
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    res.status(400);
    throw new Error('用戶已存在');
  }

  // 創建用戶
  const user = await User.create({
    username,
    email,
    password,
    role,
  });

  if (user) {
    res.status(201).json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('無效的用戶數據');
  }
});

// @desc    用戶登錄
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 查找用戶
  const user = await User.findOne({ email });

  // 檢查用戶是否存在並驗證密碼
  if (user && (await user.matchPassword(password))) {
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('電子郵件或密碼無效');
  }
});

// @desc    獲取用戶個人資料
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error('用戶未找到');
  }
});

// @desc    更新用戶資料
// @route   PUT /api/auth/update-user
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  const userId = req.user._id;

  // 檢查用戶是否存在
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error('用戶未找到');
  }

  // 檢查新的 email 或 username 是否已被其他用戶使用
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('該電子郵件已被使用');
    }
  }

  if (username && username !== user.username) {
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      res.status(400);
      throw new Error('該用戶名已被使用');
    }
  }

  // 更新用戶資料
  user.username = username || user.username;
  user.email = email || user.email;

  const updatedUser = await user.save();

  res.json({
    user: {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
    }
  });
});

module.exports = { registerUser, loginUser, getUserProfile, updateUser }; 