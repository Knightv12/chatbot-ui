const mongoose = require('mongoose');

const teacherStudentSchema = mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 確保一個學生只能有一個老師
teacherStudentSchema.index({ student: 1 }, { unique: true });

const TeacherStudent = mongoose.model('TeacherStudent', teacherStudentSchema);

module.exports = TeacherStudent; 