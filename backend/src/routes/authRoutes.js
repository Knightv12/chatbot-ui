const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { connectStudentToTeacher, getTeacherStudents, getStudentTeacher } = require('../controllers/teacherStudentController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

// 註冊新用戶
router.post('/register', registerUser);

// 用戶登錄
router.post('/login', loginUser);

// 獲取用戶資料
router.get('/profile', protect, getUserProfile);

// 將學生連接到老師
router.post('/connect', protect, teacherOnly, connectStudentToTeacher);

// 獲取老師的所有學生
router.get('/teacher/students', protect, getTeacherStudents);

// 獲取學生的老師
router.get('/student/teacher', protect, getStudentTeacher);

module.exports = router; 