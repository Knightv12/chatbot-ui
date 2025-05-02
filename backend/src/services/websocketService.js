const WebSocket = require('ws');
const { Ollama } = require('@langchain/community/llms/ollama');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.init();
  }

  init() {
    this.wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', async (message) => {
        try {
          // Handle received message (receive text message from client)
          const userMessage = message.toString();
          
          // Call OpenRouter API for streaming response
          this.streamResponseFromLLM(userMessage, ws);
        } catch (error) {
          console.error('WebSocket processing error:', error);
          ws.send('An error occurred while processing your message');
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  async streamResponseFromLLM(message, ws) {
    try {
      // 初始化 Ollama 模型
      const llm = new Ollama({
        model: "llama3.2",
        temperature: 0.3
      });

      // 使用流式處理回應
      const stream = await llm.stream(message);
      
      for await (const chunk of stream) {
        ws.send(chunk);
      }
      
      ws.send('[END]');
    } catch (error) {
      console.error('Stream response error:', error);
      ws.send('An error occurred while getting the response');
      ws.send('[END]');
    }
  }
}

module.exports = WebSocketService; 