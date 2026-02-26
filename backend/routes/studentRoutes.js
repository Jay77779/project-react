
const express = require("express");
const bcrypt = require("bcryptjs");
const { authMiddleware } = require("./auth");
const Student = require("../models/student.js");
const PasswordChangeLog = require("../models/passwordChangeLog.js");
const router = express.Router();
const { sendWelcomeEmail, sendOtpEmail, isEmailConfigured } = require("../services/emailService");

// In-memory OTP store: studentId -> { otp, expiresAt }
const passwordChangeOtpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// ✅ Student: View own profile and marks
router.get("/me", authMiddleware(["student"]), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Student: update own profile
router.put("/me", authMiddleware(["student"]), async (req, res) => {
  try {
    console.log('Update request for student:', req.user.id);
    console.log('Payload received:', req.body);
    
    const update = { ...req.body };
    // Prevent role changes or other protected fields
    delete update.role;
    delete update._id;
    
    // Do not allow direct password update via this route; use OTP flow
    delete update.password;

    console.log('Applying update:', update);
    const student = await Student.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
    
    if (!student) return res.status(404).json({ message: "Student not found" });
    
    console.log('Update successful:', student);
    res.json(student);
  } catch (error) {
    console.error('Update error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Student: send OTP to email for password change (logged-in flow)
router.post("/me/send-otp", authMiddleware(["student"]), async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });
    const email = student.email;
    const name = student.name || "Student";
    if (!email) return res.status(400).json({ message: "No email on file. Contact admin." });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    passwordChangeOtpStore.set(String(req.user.id), { otp, expiresAt });

    const emailResult = await sendOtpEmail(email, name, otp);

    if (emailResult.success) {
      return res.json({ message: "OTP sent to your email. Valid for 10 minutes." });
    }
    // Email not configured: in dev only, return OTP so user can still test
    const isDev = process.env.NODE_ENV !== "production";
    if (!isEmailConfigured() && isDev) {
      console.log(`[DEV] Password change OTP for ${email}: ${otp} (valid 10 min)`);
      return res.json({
        message: "Email not configured. Use the OTP below for testing (set EMAIL_USER & EMAIL_PASS in .env for real email).",
        otpForDev: otp,
      });
    }
    return res.status(500).json({
      message: emailResult.message || "Failed to send OTP. Set EMAIL_USER and EMAIL_PASS in backend .env (use Gmail App Password).",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      message: error.message || "Failed to send OTP. Check backend .env (EMAIL_USER, EMAIL_PASS) and server logs.",
    });
  }
});

// Student: change password with OTP (logged-in flow)
router.post("/me/change-password-with-otp", authMiddleware(["student"]), async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const stored = passwordChangeOtpStore.get(String(req.user.id));
    if (!stored) {
      return res.status(400).json({ message: "OTP expired or not requested. Please request a new OTP." });
    }
    if (Date.now() > stored.expiresAt) {
      passwordChangeOtpStore.delete(String(req.user.id));
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }
    if (String(otp).trim() !== stored.otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }
    if (!newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
    await Student.findByIdAndUpdate(req.user.id, { password: hashedPassword });
    // Log password change for teacher/audit view
    try {
      await PasswordChangeLog.create({
        studentId: req.user.id,
        method: "student-otp",
      });
    } catch (logErr) {
      console.error("Failed to log password change:", logErr);
      // Do not fail the main request if logging fails
    }
    passwordChangeOtpStore.delete(String(req.user.id));

    res.json({ message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= PUBLIC FORGOT PASSWORD (LOGIN SCREEN) =================

// In-memory OTP store for forgot-password by email: email -> { otp, expiresAt }
const forgotPasswordOtpStore = new Map();
const FORGOT_OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Public: send OTP to student's email for forgot password (no auth; student only)
router.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const student = await Student.findOne({ email: String(email).trim().toLowerCase() }).lean();
    if (!student) {
      return res.status(404).json({ message: "No student found with this email." });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + FORGOT_OTP_EXPIRY_MS;
    forgotPasswordOtpStore.set(String(student.email).toLowerCase(), { otp, expiresAt, studentId: String(student._id) });

    const emailResult = await sendOtpEmail(student.email, student.name || "Student", otp);

    if (emailResult.success) {
      return res.json({ message: "OTP sent to your email. Valid for 10 minutes." });
    }

    const isDev = process.env.NODE_ENV !== "production";
    if (!isEmailConfigured() && isDev) {
      console.log(`[DEV] Forgot-password OTP for ${student.email}: ${otp} (valid 10 min)`);
      return res.json({
        message: "Email not configured. Use the OTP below for testing (set EMAIL_USER & EMAIL_PASS in .env for real email).",
        otpForDev: otp,
      });
    }

    return res.status(500).json({
      message: emailResult.message || "Failed to send OTP. Set EMAIL_USER and EMAIL_PASS in backend .env (use Gmail App Password).",
    });
  } catch (error) {
    console.error("Forgot-password send OTP error:", error);
    return res.status(500).json({
      message: error.message || "Failed to send OTP. Check backend .env (EMAIL_USER, EMAIL_PASS) and server logs.",
    });
  }
});

// Public: change password using email + OTP (no auth; student only)
router.post("/forgot-password/change", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required." });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const key = String(email).trim().toLowerCase();
    const stored = forgotPasswordOtpStore.get(key);

    if (!stored) {
      return res.status(400).json({ message: "OTP expired or not requested. Please request a new OTP." });
    }
    if (Date.now() > stored.expiresAt) {
      forgotPasswordOtpStore.delete(key);
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }
    if (String(otp).trim() !== stored.otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    const student = await Student.findOne({ email: key });
    if (!student) {
      return res.status(404).json({ message: "Student not found for this email." });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword).trim(), 10);
    student.password = hashedPassword;
    await student.save();

    // Log password change for teacher/audit view
    try {
      await PasswordChangeLog.create({
        studentId: student._id,
        method: "student-otp",
      });
    } catch (logErr) {
      console.error("Failed to log forgot-password change:", logErr);
    }

    forgotPasswordOtpStore.delete(key);

    res.json({ message: "Password changed successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Forgot-password change error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: view student password changes with optional date filters
// GET /api/students/password-changes?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/password-changes", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};
    if (from || to) {
      filter.changedAt = {};
      if (from) {
        filter.changedAt.$gte = new Date(`${from}T00:00:00.000Z`);
      }
      if (to) {
        filter.changedAt.$lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    const logs = await PasswordChangeLog.find(filter)
      .sort({ changedAt: -1 })
      .populate("studentId", "name email course semester division");

    const result = logs.map((log) => ({
      id: String(log._id),
      studentId: log.studentId ? String(log.studentId._id) : null,
      name: log.studentId?.name || "",
      email: log.studentId?.email || "",
      course: log.studentId?.course || "",
      semester: log.studentId?.semester || "",
      division: log.studentId?.division || "",
      changedAt: log.changedAt,
      method: log.method,
    }));

    res.json(result);
  } catch (error) {
    console.error("Password change logs fetch error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Add new student (with all fields, hash password)
router.post("/", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = new Student({ ...rest, password: hashedPassword });
    await student.save();
    
    // Send welcome email to student
    const emailResult = await sendWelcomeEmail(
      student.email,
      student.name,
      password // Send the plain password (before hashing)
    );
    
    res.status(201).json({
      ...student.toObject(),
      emailSent: emailResult.success,
      emailMessage: emailResult.message,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ Teacher: Get all students (list without exams for smaller payload)
router.get("/", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const students = await Student.find().lean();
    const list = students.map((s) => ({
      _id: String(s._id),
      id: String(s._id),
      name: s.name || "",
      email: s.email || "",
      course: s.course || "",
      semester: s.semester || "",
      division: s.division || "",
      phone: s.phone || "",
      address: s.address || "",
      dob: s.dob,
    }));
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Get one student by ID (for loading existing exams in Marks)
router.get("/:id", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ message: "Student not found" });
    const out = {
      _id: String(student._id),
      id: String(student._id),
      name: student.name || "",
      email: student.email || "",
      course: student.course || "",
      semester: student.semester || "",
      division: student.division || "",
      exams: Array.isArray(student.exams) ? student.exams.map((e) => ({
        examName: e.examName,
        perSubjectTotalMarks: e.perSubjectTotalMarks,
        subjects: (e.subjects || []).map((sub) => ({
          name: sub.name,
          totalMarks: sub.totalMarks,
          obtainedMarks: sub.obtainedMarks,
        })),
      })) : [],
    };
    res.json(out);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// (Optional) Teacher: Update student by ID
router.put("/:id", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// (Optional) Teacher: Delete student by ID
router.delete("/:id", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher: Submit/update marks for a student (exam + subjects)
// Body: { examName, perSubjectTotalMarks, subjects: [{ name, obtainedMarks, totalMarks }] }
// Uses findByIdAndUpdate so only exams are updated (avoids password validation on full document)
router.put("/:id/marks", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const existing = await Student.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Student not found" });
    const { examName, perSubjectTotalMarks, subjects } = req.body;
    if (!examName || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ message: "examName and non-empty subjects array are required" });
    }
    const perTotal = Number(perSubjectTotalMarks) || 100;
    const exams = Array.isArray(existing.exams) ? existing.exams : [];
    const examsCopy = exams.map((e) => ({ ...e, subjects: (e.subjects || []).map((s) => ({ ...s })) }));
    let exam = examsCopy.find((e) => e.examName && String(e.examName).trim() === String(examName).trim());
    const newSubjectEntries = subjects.map((s) => ({
      name: String(s.name).trim(),
      totalMarks: Number(s.totalMarks) || perTotal,
      obtainedMarks: Number(s.obtainedMarks) ?? null,
    }));
    if (exam) {
      const existingSubjects = exam.subjects || [];
      for (const newSubj of newSubjectEntries) {
        const existingSubj = existingSubjects.find((e) => e.name && String(e.name).trim() === newSubj.name);
        if (existingSubj && existingSubj.obtainedMarks != null && existingSubj.obtainedMarks === newSubj.obtainedMarks) {
          return res.status(400).json({
            message: `Marks for student and subject "${newSubj.name}" already recorded. No duplicate submission.`,
          });
        }
      }
      const subjectMap = new Map();
      existingSubjects.forEach((s) => {
        const name = String(s.name || "").trim();
        subjectMap.set(name, { name, totalMarks: s.totalMarks ?? perTotal, obtainedMarks: s.obtainedMarks });
      });
      newSubjectEntries.forEach((s) => subjectMap.set(s.name, s));
      exam.subjects = Array.from(subjectMap.values());
    } else {
      exam = { examName: String(examName).trim(), perSubjectTotalMarks: perTotal, subjects: newSubjectEntries };
      examsCopy.push(exam);
    }
    let totalMarksSum = 0, obtainedMarksSum = 0;
    exam.subjects.forEach((s) => {
      const t = s.totalMarks ?? perTotal;
      const o = Number(s.obtainedMarks) || 0;
      totalMarksSum += t;
      obtainedMarksSum += o;
    });
    exam.totalMarks = totalMarksSum;
    exam.obtainedMarks = obtainedMarksSum;
    exam.percentage = totalMarksSum ? parseFloat(((obtainedMarksSum / totalMarksSum) * 100).toFixed(2)) : 0;
    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: { exams: examsCopy } },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Teacher: Delete one exam (by examName) for a student
// Body: { examName: string }
router.delete("/:id/marks", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const existing = await Student.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ message: "Student not found" });
    const { examName } = req.body;
    if (!examName || String(examName).trim() === "") {
      return res.status(400).json({ message: "examName is required" });
    }
    const exams = Array.isArray(existing.exams) ? existing.exams : [];
    const filtered = exams.filter(
      (e) => !(e.examName && String(e.examName).trim() === String(examName).trim())
    );
    if (filtered.length === exams.length) {
      return res.status(404).json({ message: "Exam not found" });
    }
    await Student.findByIdAndUpdate(req.params.id, { $set: { exams: filtered } });
    res.json({ message: "Exam deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
