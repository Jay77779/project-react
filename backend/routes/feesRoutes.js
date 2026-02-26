const express = require("express");
const { authMiddleware } = require("./auth");
const Fees = require("../models/fees.js");
const Student = require("../models/student.js");
const router = express.Router();

// ✅ Teacher: Create fees for a student
router.post("/create", authMiddleware(["teacher"]), async (req, res) => {
  try {
    console.log("Create fees request:", req.body);
    const { studentId, course, semester, amount, dueDate } = req.body;

    if (!studentId || !course || !semester || !amount || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if fees already exist for this student, course, and semester
    const existingFees = await Fees.findOne({
      studentId,
      course,
      semester,
    });

    if (existingFees && existingFees.status === "Paid") {
      return res.status(400).json({ message: "Fees already paid for this semester" });
    }

    const fees = new Fees({
      studentId,
      course,
      semester,
      amount,
      dueDate: new Date(dueDate),
    });

    await fees.save();
    res.status(201).json(fees);
  } catch (error) {
    console.error("Error creating fees:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ Teacher: Create bulk fees for multiple students
router.post("/create-bulk", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { feesRecords } = req.body;

    if (!Array.isArray(feesRecords) || feesRecords.length === 0) {
      return res.status(400).json({ message: "Invalid fees records" });
    }

    const records = feesRecords.map((record) => ({
      ...record,
      dueDate: new Date(record.dueDate),
    }));

    const savedRecords = await Fees.insertMany(records);
    res.status(201).json(savedRecords);
  } catch (error) {
    console.error("Error creating bulk fees:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ Student: View their fees
router.get("/me", authMiddleware(["student"]), async (req, res) => {
  try {
    const fees = await Fees.find({ studentId: req.user.id })
      .populate("studentId", "name email course semester")
      .sort({ dueDate: -1 });

    res.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: View all fees records
router.get("/", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const fees = await Fees.find()
      .populate("studentId", "name email course semester division")
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Get fees by student
router.get("/student/:studentId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const fees = await Fees.find({ studentId: req.params.studentId })
      .populate("studentId", "name email course semester")
      .sort({ dueDate: -1 });

    if (fees.length === 0) {
      return res.status(404).json({ message: "No fees records found" });
    }

    res.json(fees);
  } catch (error) {
    console.error("Error fetching student fees:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Get fees by course and semester
router.get("/report", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { course, semester, status } = req.query;

    let filter = {};
    if (course) filter.course = course;
    if (semester) filter.semester = semester;
    if (status) filter.status = status;

    const fees = await Fees.find(filter)
      .populate("studentId", "name email course semester division")
      .sort({ dueDate: -1 });

    res.json(fees);
  } catch (error) {
    console.error("Error generating fees report:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher/Student: Record fees payment
router.post("/payment/:feesId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { paidAmount, paymentMethod, transactionId, remarks } = req.body;
    const { feesId } = req.params;

    const fees = await Fees.findById(feesId);
    if (!fees) {
      return res.status(404).json({ message: "Fees record not found" });
    }

    const totalPaid = fees.paidAmount + paidAmount;

    let status = "Pending";
    if (totalPaid >= fees.amount) {
      status = "Paid";
    } else if (totalPaid > 0) {
      status = "Partial";
    }

    const updatedFees = await Fees.findByIdAndUpdate(
      feesId,
      {
        paidAmount: totalPaid,
        status,
        paymentMethod,
        transactionId,
        remarks,
        paymentDate: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("studentId", "name email course semester");

    res.json(updatedFees);
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ Teacher: Get fees summary
router.get("/summary/stats", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { course, semester } = req.query;

    let filter = {};
    if (course) filter.course = course;
    if (semester) filter.semester = semester;

    const fees = await Fees.find(filter);

    const summary = {
      totalFees: fees.length,
      totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
      totalPaid: fees.reduce((sum, f) => sum + f.paidAmount, 0),
      pending: fees.filter((f) => f.status === "Pending").length,
      paid: fees.filter((f) => f.status === "Paid").length,
      partial: fees.filter((f) => f.status === "Partial").length,
    };

    summary.outstanding = summary.totalAmount - summary.totalPaid;
    summary.collectionPercentage =
      summary.totalAmount > 0
        ? ((summary.totalPaid / summary.totalAmount) * 100).toFixed(2)
        : 0;

    res.json(summary);
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ message: error.message });
  }
});

// ✅ Teacher: Update fees record
router.put("/:feesId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const { amount, dueDate, status, remarks } = req.body;

    const fees = await Fees.findByIdAndUpdate(
      req.params.feesId,
      { amount, dueDate, status, remarks, updatedAt: new Date() },
      { new: true }
    ).populate("studentId", "name email");

    if (!fees) {
      return res.status(404).json({ message: "Fees record not found" });
    }

    res.json(fees);
  } catch (error) {
    console.error("Error updating fees:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ Teacher: Delete fees record
router.delete("/:feesId", authMiddleware(["teacher"]), async (req, res) => {
  try {
    const fees = await Fees.findByIdAndDelete(req.params.feesId);

    if (!fees) {
      return res.status(404).json({ message: "Fees record not found" });
    }

    res.json({ message: "Fees record deleted successfully" });
  } catch (error) {
    console.error("Error deleting fees:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
