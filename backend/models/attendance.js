const mongoose = require("mongoose");

// Define Attendance schema
const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  subject: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Leave"],
    required: true,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  remarks: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Attendance", attendanceSchema);
