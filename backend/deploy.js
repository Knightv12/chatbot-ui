// 部署設定腳本
console.log('開始部署設定...');

// 檢查必要的環境變數
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`錯誤: 缺少必要的環境變數: ${missingVars.join(', ')}`);
  console.error('請確保 .env 檔案中包含這些變數或在部署環境中設定');
  process.exit(1);
}

console.log('所有必要的環境變數已設定');

// 顯示部署指南
console.log(`
===================== 部署指南 =====================

1. 後端部署 (Render.com):
   - 創建新的 Web Service
   - 連接到 GitHub 倉庫
   - 設定以下:
     * 建置命令: npm install
     * 啟動命令: node src/index.js
     * 自動部署: 開啟
   - 添加環境變數:
     * MONGODB_URI=您的MongoDB連接字串
     * JWT_SECRET=您的JWT密鑰
     * 其他必要的API密鑰

2. 前端設定:
   - 確保以下檔案使用正確的後端URL:
     * .env
     * public/_redirects
     * src/lib/api.ts

3. 數據庫初始化:
   - 在部署後，運行一次: node createDefaultUsers.js
   - 這將創建默認用戶:
     * 教師: teacher@example.com / password123
     * 學生: student@example.com / password123
     * 學生2: student2@example.com / password123

4. 測試連接:
   - 使用前端的「檢查伺服器是否運行」按鈕測試連接
   - 使用默認帳號登入測試認證系統

=========================================================
`);

// 顯示當前環境設定
console.log('當前環境設定:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || '未設定'}`);
console.log(`PORT: ${process.env.PORT || '5000 (默認)'}`);
console.log(`MongoDB: ${process.env.MONGODB_URI ? '已設定' : '未設定'}`);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? '已設定' : '未設定'}`);
console.log(`API Key: ${process.env.OPENROUTER_API_KEY ? '已設定' : '未設定'}`);

console.log('\n部署設定完成!'); 