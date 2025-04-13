const asyncHandler = require('express-async-handler');
const TeacherStudent = require('../models/TeacherStudent');
const User = require('../models/User');

// @desc    將學生連接到老師
// @route   POST /api/auth/connect
// @access  Private
const connectStudentToTeacher = asyncHandler(async (req, res) => {
  const { teacherId, studentId } = req.body;

  // 驗證老師和學生是否存在
  const teacher = await User.findById(teacherId);
  const student = await User.findById(studentId);

  if (!teacher || teacher.role !== 'teacher') {
    res.status(400);
    throw new Error('找不到指定老師');
  }

  if (!student || student.role !== 'student') {
    res.status(400);
    throw new Error('找不到指定學生');
  }

  // 檢查學生是否已經有老師
  let connection = await TeacherStudent.findOne({ student: studentId });

  if (connection) {
    // 更新學生的老師
    connection.teacher = teacherId;
    await connection.save();
  } else {
    // 創建新的關聯
    connection = await TeacherStudent.create({
      teacher: teacherId,
      student: studentId,
    });
  }

  res.status(201).json({
    success: true,
    message: '成功將學生連接到老師',
    data: connection,
  });
});

// @desc    獲取老師的所有學生
// @route   GET /api/auth/teacher/students
// @access  Private
const getTeacherStudents = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  // 驗證用戶是老師
  const teacher = await User.findById(userId);
  if (!teacher || teacher.role !== 'teacher') {
    res.status(400);
    throw new Error('找不到指定老師');
  }

  // 找出所有與此老師關聯的學生
  const connections = await TeacherStudent.find({ teacher: userId }).populate('student', 'username email role');

  // 提取學生資料
  const students = connections.map((conn) => {
    return {
      id: conn.student._id,
      username: conn.student.username,
      email: conn.student.email,
      role: conn.student.role,
    };
  });

  res.json({ students });
});

// @desc    獲取學生的老師
// @route   GET /api/auth/student/teacher
// @access  Private
const getStudentTeacher = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  // 驗證用戶是學生
  const student = await User.findById(userId);
  if (!student || student.role !== 'student') {
    res.status(400);
    throw new Error('找不到指定學生');
  }

  // 找出此學生的老師
  const connection = await TeacherStudent.findOne({ student: userId }).populate('teacher', 'username email role');

  if (!connection) {
    return res.json({ teacher: null });
  }

  // 提取老師資料
  const teacher = {
    id: connection.teacher._id,
    username: connection.teacher.username,
    email: connection.teacher.email,
    role: connection.teacher.role,
  };

  res.json({ teacher });
});

module.exports = { connectStudentToTeacher, getTeacherStudents, getStudentTeacher }; 