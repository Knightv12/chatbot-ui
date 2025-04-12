const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');

// Get reviews where student is the receiver
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get reviews for this student
    const reviews = await Review.find({ student: studentId })
      .populate('teacher', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reviews created by a teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Check if teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }
    
    // Get reviews by this teacher
    const reviews = await Review.find({ teacher: teacherId })
      .populate('student', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new review
router.post('/', async (req, res) => {
  try {
    const { teacherId, studentId, content, rating } = req.body;
    
    // Validate required fields
    if (!teacherId || !studentId || !content) {
      return res.status(400).json({ message: 'Teacher ID, student ID, and content are required' });
    }
    
    // Check if teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'First user is not a teacher' });
    }
    
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Second user is not a student' });
    }
    
    // Check if student is associated with this teacher
    if (!teacher.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student is not associated with this teacher' });
    }
    
    // Create review
    const review = new Review({
      teacher: teacherId,
      student: studentId,
      content,
      rating: rating || 5
    });
    
    await review.save();
    
    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a review
router.put('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, rating } = req.body;
    
    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Update fields
    if (content) review.content = content;
    if (rating) review.rating = rating;
    
    await review.save();
    
    res.status(200).json({ message: 'Review updated successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a review
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // Find and delete review
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 