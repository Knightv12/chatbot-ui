const asyncHandler = require('express-async-handler');
const { Ollama } = require('@langchain/community/llms/ollama');
const Chat = require('../models/Chat');
const { queryWolframAlpha, getShortAnswer, isMathQuery, optimizeWolframQuery } = require('../services/wolframService');

// 直接使用 Wolfram Alpha API 獲取圖像
const getWolframImageUrl = (query) => {
  // 優化查詢，提取數學表達式
  const optimizedQuery = optimizeWolframQuery(query);
  console.log('獲取圖像的優化查詢:', optimizedQuery);
  
  // 對輸入進行編碼
  const encodedQuery = encodeURIComponent(optimizedQuery);
  // 構建 Wolfram Alpha API 圖像 URL
  return `https://api.wolframalpha.com/v1/simple?appid=5PYGQG-WRJHRP392T&i=${encodedQuery}&width=800`;
};

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

  console.log(`收到用戶消息: ${message}`);

  try {
    let response = '';
    let wolframData = null;
    let directWolframImage = null;

    // 檢查消息是否包含關於繪圖的指令
    const isPlotRequest = message.toLowerCase().includes('plot') || 
                         message.toLowerCase().includes('graph') || 
                         message.toLowerCase().includes('繪') || 
                         message.toLowerCase().includes('畫') ||
                         message.toLowerCase().includes('圖形');
    
    // 檢查消息中是否明確提到 wolfram alpha
    const mentionsWolfram = message.toLowerCase().includes('wolfram') || 
                           message.toLowerCase().includes('alpha');
    
    console.log(`是繪圖請求: ${isPlotRequest}, 提到 Wolfram: ${mentionsWolfram}`);

    // 如果是關於繪圖的請求，直接使用 Wolfram Alpha 圖像 API
    if (isPlotRequest || mentionsWolfram) {
      console.log('檢測到繪圖請求，將使用 Wolfram Alpha');
      
      // 從消息中提取可能的數學函數
      let mathExpression = message;
      const mathRegex = /(sin|cos|tan|log|exp|sqrt|plot)\s*\(\s*([a-zA-Z0-9]+)\s*\)/i;
      const mathMatch = message.match(mathRegex);
      
      if (mathMatch) {
        mathExpression = mathMatch[0];
        console.log('提取的數學表達式:', mathExpression);
      }
      
      // 直接使用 Wolfram Alpha 簡單 API 獲取圖像
      directWolframImage = getWolframImageUrl(message);
      console.log('生成的 Wolfram Alpha URL:', directWolframImage);
      
      try {
        // 同時使用標準 API 獲取文本內容
        wolframData = await queryWolframAlpha(message);
        console.log(`Wolfram Alpha 返回結果: ${wolframData.text.length} 條文本, ${wolframData.images.length} 張圖片`);
      } catch (wolframError) {
        console.error('Wolfram Alpha API Error:', wolframError);
      }

      // 檢查是否為數學問題，如果是則使用 Wolfram Alpha API
      const isMatchedMathQuery = isMathQuery(message);
      console.log(`是否為數學查詢: ${isMatchedMathQuery}`);

      if (isMatchedMathQuery) {
        try {
          console.log('使用 Wolfram Alpha 處理數學查詢');
          // 如果是繪圖請求，則添加繪圖關鍵詞以增加 Wolfram Alpha 識別率
          let wolframQuery = message;
          if (!message.toLowerCase().includes('plot')) {
            wolframQuery = `plot ${message}`;
          }
          console.log(`增強繪圖查詢: ${wolframQuery}`);

          // 初始化 Ollama 模型，將 Wolfram 結果結合到回應中
          const llm = new Ollama({
            model: "llama3.2",
            temperature: 0.3
          });
          
          // 準備提示詞
          let promptText = `
使用者的數學問題是: ${message}
`;

          // 如果有 Wolfram 數據，添加到提示詞
          if (wolframData && wolframData.text.length > 0) {
            const wolframTextResult = wolframData.text.join('\n');
            promptText += `
Wolfram Alpha 提供的答案:
${wolframTextResult}
`;
          }

          promptText += `
請基於以上數據提供一個清晰易懂的回應。告知使用者將展示 Wolfram Alpha 生成的圖形。使用中文繁體回答，語言自然流暢。
`;
          
          console.log('向 LLM 發送包含 Wolfram 數據的提示');
          response = await llm.call(promptText);
          
          // 如果有直接 Wolfram 圖像 URL，添加到回應中
          if (directWolframImage) {
            console.log('添加 Wolfram Alpha 圖像到回應');
            // 使用 Markdown 圖片語法
            response += `\n\n![Wolfram Alpha 圖形](${directWolframImage})`;
          }
          
        } catch (llmError) {
          console.error('LLM Error:', llmError);
          // 添加一個簡單的回應，直接使用URL
          response = `我已使用 Wolfram Alpha 處理您的請求。以下是結果：\n\n${directWolframImage}`;
        }
      } else {
        // 非數學問題但要求使用 Wolfram Alpha，直接使用URL
        response = `我已使用 Wolfram Alpha 處理您的請求。以下是結果：\n\n${directWolframImage}`;
      }
    } else {
      // 檢查是否為數學問題，如果是則使用 Wolfram Alpha API
      const isMatchedMathQuery = isMathQuery(message);
      console.log(`是否為數學查詢: ${isMatchedMathQuery}`);

      if (isMatchedMathQuery) {
        try {
          console.log('使用 Wolfram Alpha 處理數學查詢');
          // 如果是繪圖請求，則添加繪圖關鍵詞以增加 Wolfram Alpha 識別率
          let wolframQuery = message;
          if (message.toLowerCase().includes('plot') || 
              message.toLowerCase().includes('graph') || 
              message.toLowerCase().includes('繪圖') || 
              message.toLowerCase().includes('畫圖')) {
            // 檢查是否已包含 "plot"
            if (!message.toLowerCase().includes('plot')) {
              wolframQuery = `plot ${message}`;
            }
            console.log(`增強繪圖查詢: ${wolframQuery}`);
          }

          // 獲取 Wolfram Alpha 的結果
          wolframData = await queryWolframAlpha(wolframQuery);
          console.log(`Wolfram Alpha 返回結果: ${wolframData.text.length} 條文本, ${wolframData.images.length} 張圖片`);
          
          // 準備 AI 的回應
          const wolframTextResult = wolframData.text.join('\n');
          
          // 初始化 Ollama 模型，將 Wolfram 結果結合到回應中
          const llm = new Ollama({
            model: "llama3.2",
            temperature: 0.3
          });
          
          const promptWithWolframData = `
使用者的數學問題是: ${message}

Wolfram Alpha 提供的答案:
${wolframTextResult}

請基於以上數據提供一個清晰易懂的回應。如果有圖形可用，請告知使用者可以看到相關圖表。使用中文繁體回答，語言自然流暢。
`;
          
          console.log('向 LLM 發送包含 Wolfram 數據的提示');
          response = await llm.call(promptWithWolframData);
          
          // 為回應添加圖像引用
          if (wolframData.images && wolframData.images.length > 0) {
            console.log('添加圖像引用到回應中');
            response += '\n\n以下是 Wolfram Alpha 生成的圖形：';
            
            wolframData.images.forEach((image, index) => {
              // 直接添加URL，不使用特殊標記或HTML標籤
              response += `\n\n${image.url}`;
            });
          }
          
        } catch (wolframError) {
          console.error('Wolfram Alpha Error:', wolframError);
          // 如果 Wolfram Alpha 失敗，使用 Ollama 作為後備
          console.log('Wolfram Alpha 處理失敗，使用 Ollama 作為後備');
          const llm = new Ollama({
            model: "llama3.2",
            temperature: 0.3
          });
          response = await llm.call(message);
        }
      } else {
        // 非數學問題，使用標準的 Ollama 模型
        console.log('使用 Ollama 處理非數學查詢');
        const llm = new Ollama({
          model: "llama3.2",
          temperature: 0.3
        });
        response = await llm.call(message);
      }
    }

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

    // 返回響應和 Wolfram 數據（如果有）
    const responseData = {
      response: response,
      chatId: chat._id,
    };

    // 如果有 Wolfram 數據，添加到響應中
    if (wolframData) {
      console.log('將 Wolfram 數據添加到響應中');
      responseData.wolframData = wolframData;
    }

    // 如果有直接 Wolfram 圖像 URL，添加到響應中
    if (directWolframImage && !response.includes('![Wolfram Alpha 圖形]')) {
      response += `\n\n![Wolfram Alpha 圖形](${directWolframImage})\n`;
    }
    responseData.response = response;

    console.log('最終 response:', response);

    res.status(200).json(responseData);
  } catch (error) {
    console.error('API Error:', error);
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