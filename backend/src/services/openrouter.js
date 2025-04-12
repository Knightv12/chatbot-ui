const axios = require('axios');

/**
 * OpenRouter服務類 - 處理與OpenRouter API的所有通信
 */
class OpenRouterService {
  /**
   * 獲取本地定義的AI模型列表
   * @returns {Object} - 模型名稱到實際模型ID的映射
   */
  static getAvailableModels() {
    return {
      'GPT-3.5 Turbo': 'openai/gpt-3.5-turbo',
      'Deepseek V3': 'deepseek/deepseek-v3-base:free',
      'Claude 3 Haiku': 'anthropic/claude-3-haiku',
      'Mistral Medium': 'mistralai/mistral-medium',
      '數學助手': 'google/gemini-pro', // 更換為有效的模型ID
      '預設模型': process.env.AI_MODEL || 'deepseek/deepseek-v3-base:free'
    };
  }

  /**
   * 從OpenRouter API獲取可用模型列表
   * 如果API調用失敗，返回本地定義的模型列表
   * @returns {Promise<Object>} - 模型名稱到實際模型ID的映射
   */
  static async fetchAvailableModels() {
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'FYP Math Learning Assistant'
        }
      });

      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error('無效的模型數據格式');
      }

      // 將API返回的模型數據轉換為易用的格式
      const apiModels = {};
      response.data.data.forEach(model => {
        if (model.id && model.name) {
          // 使用模型名稱作為鍵，模型ID作為值
          apiModels[model.name] = model.id;
        }
      });

      // 添加一些易記的別名
      const enhancedModels = {
        ...apiModels,
        'GPT-3.5 Turbo': 'openai/gpt-3.5-turbo',
        'Claude 3 Haiku': 'anthropic/claude-3-haiku',
        '數學助手': 'google/gemini-pro',
        '預設模型': process.env.AI_MODEL || 'deepseek/deepseek-v3-base:free'
      };

      console.log('成功從OpenRouter獲取模型列表');
      return enhancedModels;
    } catch (error) {
      console.error('獲取模型列表失敗:', error.message);
      // 失敗時返回本地定義的模型列表
      return this.getAvailableModels();
    }
  }
  
  /**
   * 根據聊天主題選擇合適的模型
   * @param {string} topic - 聊天主題
   * @returns {string} - 模型ID
   */
  static selectModelByTopic(topic = '') {
    const models = this.getAvailableModels();
    const lowerTopic = topic.toLowerCase();
    
    // 根據主題關鍵詞選擇模型
    if (lowerTopic.includes('數學') || lowerTopic.includes('math') || lowerTopic.includes('問題')) {
      return models['數學助手'];
    } else if (lowerTopic.includes('creative') || lowerTopic.includes('創意')) {
      return models['Claude 3 Haiku'];
    } else if (lowerTopic.includes('code') || lowerTopic.includes('程式') || lowerTopic.includes('編程')) {
      return models['GPT-3.5 Turbo']; // 對程式碼支援較好
    }
    
    // 預設模型
    return models['預設模型'];
  }

  /**
   * 從OpenRouter獲取AI回應
   * @param {Array} messages - 消息數組，包含role和content
   * @param {Object} options - 可選參數，如模型、溫度等
   * @returns {Promise<string>} - AI回應的內容
   */
  static async getCompletion(messages, options = {}) {
    try {
      const defaultOptions = {
        model: process.env.AI_MODEL || 'deepseek/deepseek-v3-base:free',
        temperature: 0.7,
        max_tokens: 1000
      };
      
      const requestOptions = { ...defaultOptions, ...options };
      
      // 如果傳入了topic，選擇適合的模型
      if (options.topic) {
        requestOptions.model = this.selectModelByTopic(options.topic);
      }
      
      // 確保模型ID有效
      const validModels = Object.values(this.getAvailableModels());
      if (!validModels.includes(requestOptions.model)) {
        console.warn(`檢測到無效的模型ID: ${requestOptions.model}，使用預設模型替代`);
        requestOptions.model = this.getAvailableModels()['預設模型'];
      }
      
      // 確保消息格式正確
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content || '' // 確保content不為null或undefined
      }));
      
      console.log('發送請求到OpenRouter API:', JSON.stringify({ 
        model: requestOptions.model,
        messagesCount: formattedMessages.length
      }, null, 2));
      
      // 打印完整請求以便偵錯
      console.log('完整請求內容:', JSON.stringify({
        model: requestOptions.model,
        messages: formattedMessages.length, // 避免打印敏感或過長的信息
        temperature: requestOptions.temperature,
        max_tokens: requestOptions.max_tokens
      }, null, 2));
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: requestOptions.model,
          messages: formattedMessages,
          temperature: requestOptions.temperature,
          max_tokens: requestOptions.max_tokens
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5000',
            'X-Title': 'FYP Math Learning Assistant'
          }
        }
      );
      
      // 打印完整響應以便偵錯（省略可能的敏感信息）
      console.log('API響應狀態:', response.status);
      console.log('API響應數據類型:', typeof response.data);
      
      // 驗證響應
      if (!response.data) {
        throw new Error('API響應為空');
      }
      
      if (!response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
        throw new Error('API響應中缺少有效的choices數組');
      }
      
      const firstChoice = response.data.choices[0];
      
      // 更靈活地處理不同的響應格式
      if (firstChoice.text) {
        // 某些模型可能直接返回text
        return firstChoice.text;
      } else if (firstChoice.message) {
        if (typeof firstChoice.message === 'string') {
          return firstChoice.message;
        } else if (firstChoice.message.content) {
          return firstChoice.message.content;
        }
      }
      
      // 如果無法找到預期格式，嘗試解析原始響應
      console.log('無法找到預期的響應格式，原始firstChoice類型:', typeof firstChoice);
      
      // 最後的嘗試 - 將整個響應轉為字符串並返回
      if (typeof firstChoice === 'string') {
        return firstChoice;
      } else if (typeof firstChoice === 'object') {
        return JSON.stringify(firstChoice);
      }
      
      throw new Error('無法從API響應中提取有效內容');
    } catch (error) {
      console.error('OpenRouter API 錯誤:', error.response?.data || error.message);
      
      // 嘗試使用備用模型再次請求
      if (error.response?.data?.error?.message?.includes('not a valid model ID') && !options.isRetry) {
        console.log('模型ID無效，嘗試使用備用模型重試請求');
        const backupOptions = { ...options, model: 'deepseek/deepseek-v3-base:free', isRetry: true };
        return this.getCompletion(messages, backupOptions);
      }
      
      // 加強錯誤處理，提供更多詳細信息
      if (error.response) {
        console.error('狀態碼:', error.response.status);
        console.error('回應頭:', error.response.headers);
        console.error('回應內容:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('請求已發送但未收到回應');
        console.error('請求詳情:', error.request);
      }
      
      throw error;
    }
  }
  
  /**
   * 流式接收AI回應 (可用於未來實現打字機效果)
   * @param {Array} messages - 消息數組
   * @param {Object} options - 選項
   * @param {Function} onChunk - 每收到一塊數據時的回調
   * @returns {Promise<string>} - 完整回應
   */
  static async getCompletionStream(messages, options = {}, onChunk) {
    // 這裡可以實現流式API調用
    // 目前先使用模擬實現
    const fullResponse = await this.getCompletion(messages, options);
    const chunks = fullResponse.match(/.{1,20}/g) || [];
    
    let fullText = '';
    for (const chunk of chunks) {
      fullText += chunk;
      if (typeof onChunk === 'function') {
        onChunk(chunk, fullText);
      }
      // 模擬延遲
      await new Promise(r => setTimeout(r, 50));
    }
    
    return fullResponse;
  }
}

module.exports = { OpenRouterService };