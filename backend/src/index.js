const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const WebSocketService = require('./services/websocketService');

// 路由導入
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// 載入環境變數
dotenv.config();

// 連接到數據庫
connectDB();

// 初始化 Express 應用
const app = express();

// 中間件設置
app.use(morgan('dev')); // 記錄 HTTP 請求
app.use(express.json()); // 解析 JSON 請求體
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8501'], // 添加您的前端源
  credentials: true, // 允許跨域請求帶有憑證
}));

// 基本路由
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Chatbot API' });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);

// 錯誤處理中間件
app.use(notFound);
app.use(errorHandler);

// 設置服務器端口並啟動
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// 初始化 WebSocket 服務
new WebSocketService(server);

// 啟動服務器
server.listen(PORT, () => {
  console.log(`服務器運行在 ${process.env.NODE_ENV} 模式下的端口 ${PORT}`);
}); 