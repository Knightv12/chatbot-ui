const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const reviewRoutes = require('./routes/reviews');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const { OpenRouterService } = require('./services/openrouter');

dotenv.config();

const app = express();

// CORS settings
const corsOptions = {
  origin: function(origin, callback) {
    // 允許來自 Cloudflare Pages 和本地開發環境的請求
    const allowedOrigins = [
      'https://chatbot-ui-c03.pages.dev',  // Cloudflare Pages
      'https://fypclass.pages.dev',        // 如有其他 Cloudflare 域名
      'http://localhost:8501',             // 本地開發前端
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:8501',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    // 檢查來源是否在允許列表中或為空（如 Postman）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS 已拒絕來源:', origin);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  cors: {
    origin: [
      'https://chatbot-ui-c03.pages.dev', // Cloudflare Pages 
      'https://fypclass.pages.dev',       // 如有其他 Cloudflare 域名
      'http://localhost:8501', 
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://127.0.0.1:8501', 
      'http://127.0.0.1:3000', 
      'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// WebSocket connection handling
wss.on('connection', async (ws, req) => {
  console.log('New WebSocket connection established');

  // Handle connection errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('message', async (message) => {
    try {
      const userMessage = message.toString();
      console.log('Message received:', userMessage);
      
      // Parse message, check if it contains topic information (format: "TOPIC:math|MESSAGE:actual message content")
      let topic = 'math'; // Default topic
      let actualMessage = userMessage;
      
      if (userMessage.startsWith('TOPIC:')) {
        const parts = userMessage.split('|MESSAGE:');
        if (parts.length === 2) {
          topic = parts[0].replace('TOPIC:', '').trim();
          actualMessage = parts[1].trim();
          console.log(`Topic detected: ${topic}, Actual message: ${actualMessage}`);
        }
      }
      
      // Prepare message format
      const messages = [
        {
          role: 'system',
          content: 'You are a math tutoring assistant, focused on helping students learn secondary school mathematics. Please provide clear, accurate, and educational responses.'
        },
        {
          role: 'user',
          content: actualMessage
        }
      ];

      // Call OpenRouter API, pass topic to select appropriate model
      const aiResponse = await OpenRouterService.getCompletion(messages, { topic });
      console.log('AI response:', aiResponse);
      
      // Send response in chunks
      const chunks = aiResponse.match(/.{1,100}/g) || [];
      for (const chunk of chunks) {
        ws.send(chunk);
      }
      ws.send('[END]');
    } catch (error) {
      console.error('Error processing message:', error);
      if (error.response) {
        console.error('API error details:', error.response.data);
      }
      ws.send('Sorry, there was an error processing your request. Please try again later.');
      ws.send('[END]');
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Express middleware
app.use(express.json());

// 添加健康檢查端點
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: '後端伺服器正在運行', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running at ws://localhost:${PORT}/ws`);
}); 