const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Chat = require('../models/Chat');

// @desc    發送消息到LLM並保存對話
// @route   POST /api/chat/message
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { message, topic } = req.body;
  const userId = req.user._id;

  if (!message) {
    res.status(400);
    throw new Error('請提供消息內容');
  }

  try {
    // 調用 OpenRouter API
    console.log('OpenRouter API 請求配置:', {
      model: process.env.OPENROUTER_MODEL,
      auth: `Bearer ${process.env.OPENROUTER_API_KEY.substring(0, 10)}...`,
    });
    
    const openRouterResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://chatbot-ui.vercel.app/',
          'X-Title': 'Chatbot UI',
        },
      }
    );

    // 添加調試日誌來查看響應結構
    console.log('OpenRouter API Response:', JSON.stringify(openRouterResponse.data, null, 2));
    
    // 檢查是否有錯誤響應
    if (openRouterResponse.data.error) {
      throw new Error(`API返回錯誤: ${openRouterResponse.data.error.message || '未知錯誤'}`);
    }
    
    // 確保響應中包含必要的數據
    if (!openRouterResponse.data.choices || !openRouterResponse.data.choices.length) {
      throw new Error('API返回的數據結構無效，缺少choices');
    }
    
    const assistantResponse = openRouterResponse.data.choices[0].message.content;

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
    chat.messages.push({ role: 'assistant', content: assistantResponse });

    // 保存聊天
    await chat.save();

    res.status(200).json({
      response: assistantResponse,
      chatId: chat._id,
    });
  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    
    // 添加更詳細的錯誤日誌
    if (error.response) {
      console.error('錯誤狀態碼:', error.response.status);
      console.error('錯誤響應頭:', error.response.headers);
      console.error('錯誤響應數據:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('請求已發送但沒有收到響應:', error.request);
    } else {
      console.error('錯誤詳情:', error.stack);
    }
    
    res.status(500);
    throw new Error('無法處理聊天請求: ' + (error.message || '未知錯誤'));
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