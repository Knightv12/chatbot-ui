# 後端設置指南

要完成後端設置並運行服務，請按照以下步驟操作：

## 1. 安裝 MongoDB

### 選項 1：本地 MongoDB

1. 從[官方網站](https://www.mongodb.com/try/download/community)下載並安裝 MongoDB 社區版。

2. 啟動 MongoDB 服務：
   - Windows: 通常會作為服務自動運行
   - MacOS/Linux: 運行 `sudo systemctl start mongod`

### 選項 2：使用 MongoDB Atlas (雲服務)

1. 註冊 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)。

2. 創建一個新的集群。

3. 獲取連接字符串並更新您的 `.env` 文件：

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/chatbot
```

## 2. 獲取 OpenRouter API 密鑰

1. 註冊 [OpenRouter](https://openrouter.ai/)。

2. 生成 API 密鑰。

3. 更新您的 `.env` 文件：

```
OPENROUTER_API_KEY=your_api_key_here
```

## 3. 設置 JWT 密鑰

為了安全起見，更新您的 JWT 密鑰：

```
JWT_SECRET=a_strong_random_string_for_jwt_security
```

## 4. 運行後端服務

開發模式（帶有自動重新載入）：

```bash
npm run dev
```

生產模式：

```bash
npm start
```

## 連接前端

確保前端環境變量指向正確的後端 URL：

- API: `http://localhost:3001/api`
- WebSocket: `ws://localhost:3001/ws`

## 故障排除

- 如果出現 MongoDB 連接錯誤，請確保 MongoDB 服務正在運行或 Atlas 連接字符串正確。
- 如果出現 CORS 錯誤，請確保在 `src/index.js` 中添加了前端的正確來源。 