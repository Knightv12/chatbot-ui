const WebSocket = require('ws');
const axios = require('axios');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.init();
  }

  init() {
    this.wss.on('connection', (ws) => {
      console.log('客戶端已連接');

      ws.on('message', async (message) => {
        try {
          // 處理收到的消息（從客戶端接收文本消息）
          const userMessage = message.toString();
          
          // 呼叫 OpenRouter API 進行流式回應
          this.streamResponseFromLLM(userMessage, ws);
        } catch (error) {
          console.error('WebSocket 處理錯誤:', error);
          ws.send('處理您的消息時發生錯誤');
        }
      });

      ws.on('close', () => {
        console.log('客戶端已斷開連接');
      });

      ws.on('error', (error) => {
        console.error('WebSocket 錯誤:', error);
      });
    });
  }

  async streamResponseFromLLM(message, ws) {
    try {
      // 調試日誌
      console.log('WebSocket - OpenRouter API 請求配置:', {
        model: process.env.OPENROUTER_MODEL,
        apiKeyPrefix: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.substring(0, 10) + '...' : 'undefined',
      });
      
      // 使用 OpenRouter API 流式處理回應
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: process.env.OPENROUTER_MODEL,
          messages: [{ role: 'user', content: message }],
          stream: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://chatbot-ui.vercel.app/',
            'X-Title': 'Chatbot UI',
          },
          responseType: 'stream',
        }
      );

      // 處理流式回應
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('[DONE]')) {
            ws.send('[END]');
            return;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                ws.send(data.choices[0].delta.content);
              }
            } catch (e) {
              console.error('解析流響應出錯:', e);
            }
          }
        }
      });

      response.data.on('end', () => {
        ws.send('[END]');
      });

      response.data.on('error', (err) => {
        console.error('流響應錯誤:', err);
        ws.send('獲取回應時發生錯誤');
        ws.send('[END]');
      });
    } catch (error) {
      console.error('OpenRouter API 錯誤:', error.response?.data || error.message);
      ws.send('無法連接到語言模型');
      ws.send('[END]');
    }
  }
}

module.exports = WebSocketService; 