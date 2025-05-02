const asyncHandler = require('express-async-handler');
const { Ollama } = require('@langchain/community/llms/ollama');
const Chat = require('../models/Chat');

// @desc    發送消息到LLM並保存對話
// @route   POST /api/chat/message
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { message, topic } = req.body;
  const userId = req.user._id;

  if (!message) {
    res.status(400);
    throw new Error('Please provide a message');
  }

  try {
    // 初始化 Ollama 模型
    const llm = new Ollama({
      model: "llama3.2",
      temperature: 0.3
    });

    // 發送消息到模型
    const response = await llm.call(message);

    // 查找是否存在相關主題的聊天
    let chat = await Chat.findOne({ userId, topic });

    if (!chat) {
      // 如果不存在，則創建新的聊天
      chat = new Chat({
        userId,
        topic,
        messages: [],
      });
    }

    // 添加用戶消息和助手回覆
    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'assistant', content: response });

    // 保存聊天
    await chat.save();

    res.status(200).json({
      response: response,
      chatId: chat._id,
    });
  } catch (error) {
    console.error('Ollama API Error:', error);
    res.status(500);
    throw new Error('Unable to process chat request: ' + (error.message || 'Unknown error'));
  }
});

// @desc    獲取用戶的聊天歷史
// @route   GET /api/chat/history
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });

  res.status(200).json(chats);
});

// @desc    獲取特定聊天的詳細信息
// @route   GET /api/chat/:id
// @access  Private
const getChatById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const chatId = req.params.id;

  const chat = await Chat.findOne({ _id: chatId, userId });

  if (!chat) {
    res.status(404);
    throw new Error('聊天未找到');
  }

  res.status(200).json(chat);
});

module.exports = { sendMessage, getChatHistory, getChatById }; 