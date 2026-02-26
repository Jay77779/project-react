const mongoose = require("mongoose");

// MongoDB collection: subjects (course → semester → examName → subject name)
const subjectSchema = new mongoose.Schema({
  course: { type: String, required: true, trim: true },
  semester: { type: String, required: true, trim: true },
  examName: { type: String, required: true, trim: true, default: "General" },
  name: { type: String, required: true, trim: true },
  totalMarks: { type: Number, default: 100 },
}, { strict: true });

// Index for hierarchical access: course → semester → exam name → subject
subjectSchema.index({ course: 1, semester: 1, examName: 1, name: 1 });
subjectSchema.index({ course: 1, semester: 1 });

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;
