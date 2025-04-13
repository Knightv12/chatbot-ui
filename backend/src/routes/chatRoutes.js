const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory, getChatById } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// 發送消息到LLM
router.post('/message', protect, sendMessage);

// 獲取聊天歷史
router.get('/history', protect, getChatHistory);

// 獲取特定聊天詳情
router.get('/:id', protect, getChatById);

module.exports = router; 