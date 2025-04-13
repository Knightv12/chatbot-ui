const express = require('express');
const router = express.Router();
const {
  createReview,
  updateReview,
  deleteReview,
  getStudentReviews,
  getTeacherReviews,
} = require('../controllers/reviewController');
const { protect, teacherOnly } = require('../middleware/authMiddleware');

// 創建評論 - 只有老師能創建
router.post('/', protect, teacherOnly, createReview);

// 更新評論 - 只有創建評論的老師能更新
router.put('/:id', protect, teacherOnly, updateReview);

// 刪除評論 - 只有創建評論的老師能刪除
router.delete('/:id', protect, teacherOnly, deleteReview);

// 獲取學生的所有評論
router.get('/student/:studentId', protect, getStudentReviews);

// 獲取老師創建的所有評論
router.get('/teacher/:teacherId', protect, getTeacherReviews);

module.exports = router; 