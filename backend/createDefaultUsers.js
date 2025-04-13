require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 連接數據庫
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 連接成功'))
  .catch((err) => {
    console.error('MongoDB 連接失敗:', err);
    process.exit(1);
  });

// 定義用戶模型
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// 創建默認用戶
async function createDefaultUsers() {
  try {
    // 檢查是否已存在用戶
    const existingTeacher = await User.findOne({ email: 'teacher@example.com' });
    const existingStudent = await User.findOne({ email: 'student@example.com' });
    
    // 如果已存在，則不創建
    if (existingTeacher && existingStudent) {
      console.log('默認用戶已存在，無需創建新用戶');
      mongoose.disconnect();
      return;
    }

    // 創建教師用戶
    const teacherPassword = await bcrypt.hash('password123', 10);
    const teacher = !existingTeacher && await User.create({
      username: 'teacher',
      email: 'teacher@example.com',
      password: teacherPassword,
      role: 'teacher'
    });
    
    if (teacher) {
      console.log('成功創建教師用戶:', teacher.email);
    }

    // 創建學生用戶
    const studentPassword = await bcrypt.hash('password123', 10);
    const student = !existingStudent && await User.create({
      username: 'student',
      email: 'student@example.com',
      password: studentPassword,
      role: 'student',
      teacher: teacher ? teacher._id : null
    });
    
    if (student && teacher) {
      // 將學生添加到教師的學生列表中
      await User.updateOne(
        { _id: teacher._id },
        { $push: { students: student._id } }
      );
      console.log('成功創建學生用戶:', student.email);
      console.log('學生與教師成功關聯');
    }

    // 添加第二個學生
    const student2 = await User.findOne({ email: 'student2@example.com' });
    if (!student2 && teacher) {
      const student2Password = await bcrypt.hash('password123', 10);
      const newStudent2 = await User.create({
        username: 'student2',
        email: 'student2@example.com',
        password: student2Password,
        role: 'student',
        teacher: teacher._id
      });
      
      // 將學生2添加到教師的學生列表中
      await User.updateOne(
        { _id: teacher._id },
        { $push: { students: newStudent2._id } }
      );
      console.log('成功創建學生2用戶:', newStudent2.email);
    }

    console.log('默認用戶設定完成');

  } catch (error) {
    console.error('創建默認用戶時出錯:', error);
  } finally {
    // 關閉數據庫連接
    mongoose.disconnect();
  }
}

// 執行創建默認用戶的函數
createDefaultUsers(); 