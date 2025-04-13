# Chatbot UI 後端系統

這是一個基於 Express.js 和 MongoDB 的後端系統，為 Chatbot UI 提供 API 服務。

## 功能

- 用戶註冊和登錄
- JWT 身份驗證
- 與 OpenRouter LLM 的聊天互動
- 用戶聊天歷史儲存
- WebSocket 支持實時通信

## 技術棧

- **Node.js**: JavaScript 運行環境
- **Express.js**: Web 應用框架
- **MongoDB**: 數據庫
- **Mongoose**: MongoDB 對象模型工具
- **JWT**: 用於用戶身份驗證
- **WebSocket**: 用於實時通信
- **OpenRouter API**: 用於語言模型集成

## 如何開始

### 先決條件

- Node.js (>=14.x)
- MongoDB 實例 (本地或雲端)
- OpenRouter API 密鑰

### 安裝

1. 複製環境變數文件：

```bash
cp .env.example .env
```

2. 使用您自己的值更新 `.env` 文件：

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openrouter/auto
```

3. 安裝依賴：

```bash
npm install
```

4. 啟動開發服務器：

```bash
npm run dev
```

## API 端點

### 認證

- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 用戶登錄
- `GET /api/auth/profile` - 獲取用戶資料（需要認證）

### 聊天

- `POST /api/chat/message` - 發送消息到 LLM（需要認證）
- `GET /api/chat/history` - 獲取用戶聊天歷史（需要認證）
- `GET /api/chat/:id` - 獲取特定聊天的詳細信息（需要認證）

### WebSocket

- `ws://localhost:3001/ws` - WebSocket 連接端點，用於實時聊天

## 目錄結構

```
backend/
├── src/
│   ├── config/       # 配置文件
│   ├── controllers/  # 路由控制器
│   ├── middleware/   # 中間件
│   ├── models/       # 數據模型
│   ├── routes/       # 路由定義
│   ├── services/     # 服務
│   ├── utils/        # 工具函數
│   └── index.js      # 入口文件
├── .env              # 環境變數
└── package.json      # 項目依賴
```

## 與前端集成

前端應用程序使用以下 API 端點與後端通信：

1. 使用 REST API 進行驗證和數據操作
2. 使用 WebSocket 進行實時聊天 