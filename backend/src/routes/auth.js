const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 添加測試路由
router.get('/check-user', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: '需要提供電子郵件' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: '找不到此用戶', exists: false });
    }
    
    return res.status(200).json({ 
      message: '用戶存在', 
      exists: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
});

// 添加測試路由用於檢查密碼
router.post('/check-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 找用戶
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: '找不到此用戶' });
    }

    // 檢查密碼
    const isMatch = await user.comparePassword(password);
    return res.status(200).json({ 
      passwordCorrect: isMatch,
      message: isMatch ? '密碼正確' : '密碼錯誤'
    });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiry on user model
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://localhost:8501/reset-password/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify Reset Token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }
    
    res.status(200).json({ message: 'Token is valid', valid: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }
    
    // Set new password
    user.password = password;
    
    // Clear reset token fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Teacher's Students
router.get('/teacher/students', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Find teacher and populate students
    const teacher = await User.findById(userId).populate('students', 'username email');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    res.status(200).json({ students: teacher.students });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Student's Teacher
router.get('/student/teacher', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Find student and populate teacher
    const student = await User.findById(userId).populate('teacher', 'username email');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    res.status(200).json({ teacher: student.teacher });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Connect Student to Teacher
router.post('/connect', async (req, res) => {
  try {
    const { teacherId, studentId } = req.body;
    
    if (!teacherId || !studentId) {
      return res.status(400).json({ message: 'Both teacher and student IDs are required' });
    }

    // Find teacher and student
    const teacher = await User.findById(teacherId);
    const student = await User.findById(studentId);
    
    if (!teacher || !student) {
      return res.status(404).json({ message: 'Teacher or student not found' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'First user is not a teacher' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Second user is not a student' });
    }

    // Connect student to teacher
    student.teacher = teacherId;
    await student.save();
    
    // Add student to teacher's list
    if (!teacher.students.includes(studentId)) {
      teacher.students.push(studentId);
      await teacher.save();
    }

    res.status(200).json({ message: 'Connection successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 