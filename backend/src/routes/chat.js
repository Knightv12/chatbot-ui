const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const axios = require('axios');
const { OpenRouterService } = require('../services/openrouter');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get chat history
router.get('/history', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message
router.post('/message', auth, async (req, res) => {
  try {
    const { message, topic } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    // Get or create chat session
    let chat = await Chat.findOne({
      userId: req.user.userId,
      topic
    });

    if (!chat) {
      chat = new Chat({
        userId: req.user.userId,
        topic,
        messages: []
      });
    }

    // Add user message to chat
    chat.messages.push({
      role: 'user',
      content: message.trim()
    });

    try {
      // Get AI response, including chat history to maintain context, and pass the topic
      const aiResponse = await OpenRouterService.getCompletion(chat.messages, { topic });
      
      // Add AI response to chat
      chat.messages.push({
        role: 'assistant',
        content: aiResponse
      });

      await chat.save();

      res.json({
        response: aiResponse,
        chatId: chat._id,
        model: OpenRouterService.selectModelByTopic(topic) // Return the model information used
      });
    } catch (error) {
      // If API call fails, try falling back to a simple request without context
      console.error('API call with context failed, trying request without context:', error.message);
      
      const fallbackMessages = [
        {
          role: 'system',
          content: 'You are a math tutoring assistant, focused on helping students learn secondary school mathematics.'
        },
        {
          role: 'user',
          content: message.trim()
        }
      ];
      
      // Use topic to select model
      const fallbackResponse = await OpenRouterService.getCompletion(fallbackMessages, { topic });
      
      chat.messages.push({
        role: 'assistant',
        content: fallbackResponse
      });

      await chat.save();

      res.json({
        response: fallbackResponse,
        chatId: chat._id,
        fallback: true,
        model: OpenRouterService.selectModelByTopic(topic) // Return the model information used
      });
    }
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.response?.data?.error?.message || error.message 
    });
  }
});

// Get available models
router.get('/models', auth, async (req, res) => {
  try {
    // Use new method to get real model list from API
    const models = await OpenRouterService.fetchAvailableModels();
    res.json(models);
  } catch (error) {
    console.error('Error getting model list:', error);
    // If API call fails, fall back to using locally defined model list
    const fallbackModels = OpenRouterService.getAvailableModels();
    res.json({
      models: fallbackModels,
      fallback: true,
      error: error.message
    });
  }
});

module.exports = router;