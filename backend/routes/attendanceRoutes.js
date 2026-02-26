const express = require("express");
const { authMiddleware } = require("./auth");
const Attendance = require("../models/attendance.js");
const Student = require("../models/student.js");
const Teacher = require("../models/teacher.js");
const router = express.Router();

// ✅ Teacher: Mark attendance for a student
router.post("/mark", authMiddleware(["teacher"]), async (req, res) => {
  try {
    console.log("Mark attendance request received");
    console.log("User:", req.user);
    console.log("Request body:", req.body);

    const { studentId, date, subject, status, remarks } = req.body;

    // Validate required fields
    if (!studentId || !date || !subject || !status) {
      console.log("Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      console.log("Student not found:", studentId);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log("Student found:", student.name);

    // Parse date string properly to avoid timezone offset
    // Format: YYYY-MM-DD
    const [year, month, day] = date.split("-").map(Number);
    const attendanceDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    if (isNaN(attendanceDate)) {
      console.log("Invalid date format:", date);
      return res.status(400).json({ message: "Invalid date format. Expected YYYY-MM-DD" });
    }

    // Upsert: update if same student+date+subject exists for this teacher, else create
    const existing = await Attendance.findOne({
      studentId,
      date: attendanceDate,
      subject,
      markedBy: req.user.id,
    });

    let attendance;
    if (existing) {
      existing.status = status;
      existing.remarks = remarks || existing.remarks || "";
      await existing.save();
      attendance = existing;
    } else {
      attendance = new Attendance({
        studentId,
        date: attendanceDate,
        subject,
        status,
        remarks: remarks || "",
        markedBy: req.user.id,
      });
      await attendance.save();
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("studentId", "name email course")
      .populate("markedBy", "name email");

    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error("Error marking attendance:", error.message);
    console.error("Error stack:", error.stack);
    res.status(400).json({ message: `Error: ${error.message}` });
  }
});

// ✅ Teacher: Mark attendance for multiple students
router.post("/mark-bulk", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { attendanceRecords } = req.body; // Array of { studentId, subject, date, status, remarks }

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ message: "Invalid attendance records" });
    }

    // Validate and convert records
    const records = attendanceRecords.map((record) => {
      // Parse date properly to avoid timezone offset
      // Format: YYYY-MM-DD
      const [year, month, day] = record.date.split("-").map(Number);
      const attendanceDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      
      if (isNaN(attendanceDate)) {
        throw new Error("Invalid date format in one or more records");
      }
      return {
        ...record,
        date: attendanceDate,
        markedBy: req.user.id,
      };
    });

    const savedRecords = await Attendance.insertMany(records);
    
    // Populate and return the saved records
    const populatedRecords = await Attendance.find({ _id: { $in: savedRecords.map(r => r._id) } })
      .populate("studentId", "name email course")
      .populate("markedBy", "name email");

    res.status(201).json(populatedRecords);
  } catch (error) {
    console.error("Error marking bulk attendance:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ Student: View own attendance
router.get("/me", authMiddleware(["student"]), async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({
      studentId: req.user.id,
    })
      .populate("studentId", "name email course")
      .populate("markedBy", "name email")
      .sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Get attendance records for a specific student
router.get("/student/:studentId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({
      studentId: req.params.studentId,
    })
      .populate("studentId", "name email course semester division")
      .populate("markedBy", "name email")
      .sort({ date: -1 });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: "No attendance records found" });
    }

    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Get attendance by date and subject
router.get("/report", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { date, subject, status } = req.query;

    let filter = {};
    if (date) filter.date = new Date(date);
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const records = await Attendance.find(filter)
      .populate("studentId", "name email course semester division")
      .populate("markedBy", "name email")
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Get attendance grid data (by date range, course, semester, subject)
router.get("/grid", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { startDate, endDate, subject, course, semester } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required (YYYY-MM-DD)" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const studentFilter = {};
    if (course) studentFilter.course = course;
    if (semester) studentFilter.semester = semester;
    const students = await Student.find(studentFilter).select("_id name").lean();
    const studentIds = students.map((s) => s._id);

    const attendanceFilter = {
      studentId: { $in: studentIds },
      date: { $gte: start, $lte: end },
    };
    if (subject) attendanceFilter.subject = subject;

    const records = await Attendance.find(attendanceFilter).lean();
    const grid = records.map((r) => ({
      studentId: String(r.studentId),
      date: r.date.toISOString().split("T")[0],
      status: r.status,
    }));

    res.json({ students, grid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Get attendance summary for a student
router.get("/summary/:studentId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;

    let filter = { studentId };
    if (subject) filter.subject = subject;

    const records = await Attendance.find(filter);

    const summary = {
      totalClasses: records.length,
      present: records.filter((r) => r.status === "Present").length,
      absent: records.filter((r) => r.status === "Absent").length,
      leave: records.filter((r) => r.status === "Leave").length,
    };

    summary.percentage = summary.totalClasses > 0 ? ((summary.present / summary.totalClasses) * 100).toFixed(2) : 0;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Update attendance record
router.put("/:attendanceId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.attendanceId,
      { status, remarks },
      { new: true }
    )
      .populate("studentId", "name email")
      .populate("markedBy", "name email");

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ Teacher: Delete attendance record
router.delete("/:attendanceId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.attendanceId);

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
