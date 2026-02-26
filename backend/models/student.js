const mongoose = require("mongoose");

// Define Student schema
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  course: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  division: {
    type: String,
    required: true,
  },
  // Exams structure: each student can have multiple exams,
  // and each exam can have multiple subjects with marks.
  exams: [
    {
      examName: { type: String, trim: true },
      perSubjectTotalMarks: { type: Number },
      subjects: [
        {
          name: { type: String, trim: true },
          totalMarks: { type: Number },
          obtainedMarks: { type: Number },
        },
      ],
      totalMarks: { type: Number },
      obtainedMarks: { type: Number },
      percentage: { type: Number },
    },
  ],
  role: {
    type: String,
    default: "student",
  },
});

// Create model
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
