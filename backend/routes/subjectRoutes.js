const express = require("express");
const { authMiddleware } = require("./auth");
const Subject = require("../models/subject");
const Student = require("../models/student");
const router = express.Router();

// GET /api/subjects - list all subjects (ordered: course → semester → exam name → subject)
router.get("/", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ course: 1, semester: 1, examName: 1, name: 1 }).lean();
    const list = subjects.map((s) => ({
      _id: String(s._id),
      id: String(s._id),
      course: s.course || "",
      semester: s.semester || "",
      examName: s.examName || "",
      name: s.name || "",
      totalMarks: s.totalMarks != null ? s.totalMarks : 100,
    }));
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/subjects/grouped - hierarchy: course → semester → exam name → subjects (easy access by exam type)
router.get("/grouped", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ course: 1, semester: 1, examName: 1, name: 1 }).lean();
    const grouped = {};
    for (const s of subjects) {
      const c = s.course || "";
      const sem = s.semester || "";
      const exam = s.examName || "";
      if (!grouped[c]) grouped[c] = {};
      if (!grouped[c][sem]) grouped[c][sem] = {};
      if (!grouped[c][sem][exam]) grouped[c][sem][exam] = [];
      grouped[c][sem][exam].push({
        _id: String(s._id),
        name: s.name || "",
        totalMarks: s.totalMarks != null ? s.totalMarks : 100,
      });
    }
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/subjects/by-student/:studentId - subjects by student's course & semester; ?examName=X filters by exam
router.get("/by-student/:studentId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });
    const { course, semester } = student;
    if (!course || !semester) {
      return res.status(400).json({ message: "Student has no course or semester set" });
    }
    const examName = (req.query.examName || "").trim();
    const query = { course, semester };
    if (examName) query.examName = examName;
    const subjects = await Subject.find(query).sort({ examName: 1, name: 1 }).lean();
    const list = subjects.map((s) => ({
      _id: String(s._id),
      id: String(s._id),
      course: s.course || "",
      semester: s.semester || "",
      examName: s.examName || "",
      name: s.name || "",
      totalMarks: s.totalMarks != null ? s.totalMarks : 100,
    }));
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/subjects - save subjects under course → semester → exam name (exam name required)
// Body: { course, semester, examName, subjects: [{ name }] }
router.post("/", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { course, semester, subjects } = req.body;
    const examNameRaw = req.body.examName ?? req.body.examType ?? req.body.exam_name ?? "";
    if (!course || !semester) {
      return res.status(400).json({
        message: "course and semester are required",
      });
    }
    const exam = String(examNameRaw || "").trim() || "General";
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        message: "subjects must be a non-empty array",
      });
    }
    const courseVal = String(course).trim();
    const semesterVal = String(semester).trim();
    const docs = subjects
      .filter((s) => s && String(s.name || "").trim())
      .map((s) => ({
        course: courseVal,
        semester: semesterVal,
        examName: exam,
        name: String(s.name || "").trim(),
        totalMarks: Number(s.totalMarks) || 100,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (docs.length === 0) {
      return res.status(400).json({ message: "At least one subject name is required" });
    }
    const created = await Subject.create(docs);
    const list = created.map((doc) => ({
      _id: String(doc._id),
      id: String(doc._id),
      course: doc.course || "",
      semester: doc.semester || "",
      examName: doc.examName || "",
      name: doc.name || "",
      totalMarks: doc.totalMarks != null ? doc.totalMarks : 100,
    }));
    res.status(201).json(list);
  } catch (error) {
    const message = error.message || "Failed to add subjects";
    res.status(500).json({ message });
  }
});

// POST /api/subjects/backfill-exam-name - set examName for docs that don't have it (so exam type filter works)
router.post("/backfill-exam-name", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const defaultExamName = (req.body && req.body.defaultExamName) || "General";
    const result = await Subject.updateMany(
      { $or: [{ examName: { $exists: false } }, { examName: "" }, { examName: null }] },
      { $set: { examName: String(defaultExamName).trim() || "General" } }
    );
    res.json({ message: "Backfill done.", modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/subjects/by-course-semester?course=X&semester=Y - delete all subjects for that course & semester
router.delete("/by-course-semester", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { course, semester } = req.query;
    if (!course || !semester) {
      return res.status(400).json({ message: "course and semester query params are required" });
    }
    const result = await Subject.deleteMany({ course: String(course).trim(), semester: String(semester).trim() });
    res.json({ deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/subjects/by-course-semester - replace all subjects for a course & semester
// Body: { course, semester, subjects: [{ name }] }
router.put("/by-course-semester", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { course, semester, subjects } = req.body;
    if (!course || !semester) {
      return res.status(400).json({ message: "course and semester are required" });
    }
    if (!Array.isArray(subjects)) {
      return res.status(400).json({ message: "subjects must be an array" });
    }
    const c = String(course).trim();
    const sem = String(semester).trim();
    await Subject.deleteMany({ course: c, semester: sem });
    const exam = String((req.body && req.body.examName) || "").trim();
    const docs = subjects
      .filter((s) => s && String(s.name || "").trim())
      .map((s) => ({ course: c, semester: sem, examName: exam, name: String(s.name || "").trim(), totalMarks: 100 }));
    if (docs.length > 0) {
      await Subject.insertMany(docs);
    }
    const updated = await Subject.find({ course: c, semester: sem }).sort({ name: 1 }).lean();
    const list = updated.map((s) => ({
      _id: String(s._id),
      id: String(s._id),
      course: s.course || "",
      semester: s.semester || "",
      examName: s.examName || "",
      name: s.name || "",
      totalMarks: s.totalMarks != null ? s.totalMarks : 100,
    }));
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/subjects/:id - delete a single subject by id
router.delete("/:id", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const doc = await Subject.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Subject not found" });
    res.json({ deleted: true, id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/subjects/:id - update a single subject (name, examName)
router.put("/:id", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const name = req.body && String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "name is required" });
    const update = { name };
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, "examName")) {
      update.examName = String(req.body.examName || "").trim();
    }
    const doc = await Subject.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).lean();
    if (!doc) return res.status(404).json({ message: "Subject not found" });
    res.json({
      _id: String(doc._id),
      id: String(doc._id),
      course: doc.course || "",
      semester: doc.semester || "",
      examName: doc.examName || "",
      name: doc.name || "",
      totalMarks: doc.totalMarks != null ? doc.totalMarks : 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
