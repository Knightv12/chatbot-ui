const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const User = require('../models/User');
const TeacherStudent = require('../models/TeacherStudent');

// @desc    創建評論
// @route   POST /api/reviews
// @access  Private (只有老師可以創建評論)
const createReview = asyncHandler(async (req, res) => {
  const { teacherId, studentId, content, rating } = req.body;

  // 驗證老師和學生
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

  // 驗證教師和學生之間的關係
  const connection = await TeacherStudent.findOne({
    teacher: teacherId,
    student: studentId,
  });

  if (!connection) {
    res.status(403);
    throw new Error('此學生不屬於該老師');
  }

  // 創建評論
  const review = await Review.create({
    teacher: teacherId,
    student: studentId,
    content,
    rating: rating || 5,
  });

  // 填充老師和學生資訊
  await review.populate('teacher', 'username email role');
  await review.populate('student', 'username email role');

  res.status(201).json({
    success: true,
    review: {
      _id: review._id,
      teacher: {
        id: review.teacher._id,
        username: review.teacher.username,
        email: review.teacher.email,
        role: review.teacher.role,
      },
      student: {
        id: review.student._id,
        username: review.student.username,
        email: review.student.email,
        role: review.student.role,
      },
      content: review.content,
      rating: review.rating,
      createdAt: review.createdAt,
    },
  });
});

// @desc    更新評論
// @route   PUT /api/reviews/:id
// @access  Private (只有創建評論的老師可以更新)
const updateReview = asyncHandler(async (req, res) => {
  const { content, rating } = req.body;
  const reviewId = req.params.id;

  // 查找評論
  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('找不到該評論');
  }

  // 驗證請求者是否為評論的作者
  if (review.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('無權更新此評論');
  }

  // 更新評論
  if (content) review.content = content;
  if (rating) review.rating = rating;

  await review.save();
  await review.populate('teacher', 'username email role');
  await review.populate('student', 'username email role');

  res.json({
    success: true,
    review: {
      _id: review._id,
      teacher: {
        id: review.teacher._id,
        username: review.teacher.username,
        email: review.teacher.email,
        role: review.teacher.role,
      },
      student: {
        id: review.student._id,
        username: review.student.username,
        email: review.student.email,
        role: review.student.role,
      },
      content: review.content,
      rating: review.rating,
      createdAt: review.createdAt,
    },
  });
});

// @desc    刪除評論
// @route   DELETE /api/reviews/:id
// @access  Private (只有創建評論的老師可以刪除)
const deleteReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.id;

  // 查找評論
  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('找不到該評論');
  }

  // 驗證請求者是否為評論的作者
  if (review.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('無權刪除此評論');
  }

  // 刪除評論
  await review.remove();

  res.json({
    success: true,
    message: '評論已成功刪除',
  });
});

// @desc    獲取學生的所有評論
// @route   GET /api/reviews/student/:studentId
// @access  Private
const getStudentReviews = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;

  // 驗證學生是否存在
  const student = await User.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('找不到該學生');
  }

  // 獲取評論
  const reviews = await Review.find({ student: studentId })
    .populate('teacher', 'username email role')
    .populate('student', 'username email role')
    .sort({ createdAt: -1 });

  // 將評論資料轉換為前端需要的格式
  const formattedReviews = reviews.map((review) => ({
    _id: review._id,
    teacher: {
      id: review.teacher._id,
      username: review.teacher.username,
      email: review.teacher.email,
      role: review.teacher.role,
    },
    student: {
      id: review.student._id,
      username: review.student.username,
      email: review.student.email,
      role: review.student.role,
    },
    content: review.content,
    rating: review.rating,
    createdAt: review.createdAt,
  }));

  res.json({ reviews: formattedReviews });
});

// @desc    獲取老師創建的所有評論
// @route   GET /api/reviews/teacher/:teacherId
// @access  Private
const getTeacherReviews = asyncHandler(async (req, res) => {
  const teacherId = req.params.teacherId;

  // 驗證老師是否存在
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    res.status(404);
    throw new Error('找不到該老師');
  }

  // 獲取評論
  const reviews = await Review.find({ teacher: teacherId })
    .populate('teacher', 'username email role')
    .populate('student', 'username email role')
    .sort({ createdAt: -1 });

  // 將評論資料轉換為前端需要的格式
  const formattedReviews = reviews.map((review) => ({
    _id: review._id,
    teacher: {
      id: review.teacher._id,
      username: review.teacher.username,
      email: review.teacher.email,
      role: review.teacher.role,
    },
    student: {
      id: review.student._id,
      username: review.student.username,
      email: review.student.email,
      role: review.student.role,
    },
    content: review.content,
    rating: review.rating,
    createdAt: review.createdAt,
  }));

  res.json({ reviews: formattedReviews });
});

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getStudentReviews,
  getTeacherReviews,
}; 