const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 加載環境變數
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 連接到 MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 連接成功'))
  .catch((err) => {
    console.error('MongoDB 連接失敗:', err);
    process.exit(1);
  });

// 加載 User 模型
const User = require('./models/User');

// 創建測試用戶
async function createTestUser() {
  try {
    // 檢查用戶是否已存在
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('測試用戶已存在:', existingUser.email);
      process.exit(0);
    }
    
    // 創建新用戶
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'student'
    });
    
    await testUser.save();
    console.log('測試用戶創建成功:', testUser.email);
    
    // 顯示登錄資訊
    console.log('\n登錄資訊:');
    console.log('電子郵件: test@example.com');
    console.log('密碼: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('創建測試用戶時出錯:', error);
    process.exit(1);
  }
}

// 執行函數
createTestUser(); 