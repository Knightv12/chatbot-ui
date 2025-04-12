require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// 添加密碼比較方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// 添加評論模型
const reviewSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Review = mongoose.model('Review', reviewSchema);

// 連接數據庫
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    setupUsers();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function setupUsers() {
  try {
    // 檢查學生帳號
    const studentEmail = 'stephenshum2001@gmail.com';
    let studentUser = await User.findOne({ email: studentEmail });
    
    if (!studentUser) {
      console.log(`創建學生帳號 ${studentEmail}`);
      // 生成加密密碼
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('FYP12341234', salt);
      
      // 創建新學生用戶
      studentUser = new User({
        username: 'stephenshum2001',
        email: studentEmail,
        password: hashedPassword,
        role: 'student'
      });
      
      await studentUser.save();
      console.log('學生帳號創建成功!');
    } else {
      console.log('學生帳號已存在:', studentUser.username);
    }

    // 檢查老師帳號
    const teacherEmail = 'stephenshum2001@yahoo.com.hk';
    let teacherUser = await User.findOne({ email: teacherEmail });
    
    if (!teacherUser) {
      console.log(`創建老師帳號 ${teacherEmail}`);
      // 生成加密密碼
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('FYP43214321', salt);
      
      // 創建新老師用戶
      teacherUser = new User({
        username: 'Knightv12',
        email: teacherEmail,
        password: hashedPassword,
        role: 'teacher',
        students: []
      });
      
      await teacherUser.save();
      console.log('老師帳號創建成功!');
    } else {
      console.log('老師帳號已存在:', teacherUser.username);
    }

    // 關聯學生和老師
    if (studentUser && teacherUser) {
      // 檢查是否已經關聯
      if (!studentUser.teacher || !studentUser.teacher.equals(teacherUser._id)) {
        studentUser.teacher = teacherUser._id;
        await studentUser.save();
        console.log(`已將學生 ${studentUser.username} 關聯到老師 ${teacherUser.username}`);
      }

      // 檢查老師的學生列表
      if (!teacherUser.students.includes(studentUser._id)) {
        teacherUser.students.push(studentUser._id);
        await teacherUser.save();
        console.log(`已將學生 ${studentUser.username} 添加到老師 ${teacherUser.username} 的學生列表`);
      }
      
      // 創建示例評論
      const existingReview = await Review.findOne({ teacher: teacherUser._id, student: studentUser._id });
      if (!existingReview) {
        const review = new Review({
          teacher: teacherUser._id,
          student: studentUser._id,
          content: "學生在數學方面表現良好，尤其是三角函數和代數。但需要在微積分方面加強練習，建議多做相關習題。",
          rating: 4
        });
        
        await review.save();
        console.log('示例評論創建成功');
      } else {
        console.log('評論已存在');
      }
    }
    
    console.log('所有用戶設置完成!');
  } catch (error) {
    console.error('設置用戶時出錯:', error);
  } finally {
    mongoose.disconnect();
    console.log('已斷開數據庫連接');
  }
} 