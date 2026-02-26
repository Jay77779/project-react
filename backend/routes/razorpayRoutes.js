const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { authMiddleware } = require("./auth");
const Fees = require("../models/fees");

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_S66eNWEbdZYzjX";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

// Create Razorpay order (student only)
router.post("/create-order", authMiddleware(["student"]), async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ message: "Razorpay not configured. Set RAZORPAY_KEY_SECRET in .env" });
  }
  try {
    const { amount, feesId } = req.body;

    if (!amount || !feesId) {
      return res.status(400).json({ message: "Amount and feesId required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const fees = await Fees.findById(feesId);
    if (!fees) {
      return res.status(404).json({ message: "Fees record not found" });
    }

    if (fees.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access to fees" });
    }

    const dueAmount = fees.amount - (fees.paidAmount || 0);
    if (amount > dueAmount) {
      return res.status(400).json({ message: "Amount exceeds due amount" });
    }

    // Razorpay amount is in paise (1 INR = 100 paise); minimum 100 paise (₹1)
    const amountInPaise = Math.round(Number(amount) * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({
        message: "Minimum payment amount is ₹1. Your due amount is too low to pay online.",
      });
    }

    const receipt = `fees_${feesId}_${Date.now()}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        feesId: feesId.toString(),
        studentId: req.user.id.toString(),
        course: String(fees.course).slice(0, 255),
        semester: String(fees.semester).slice(0, 255),
      },
    });

    res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const msg = error.error?.description || error.message || "Razorpay error";
    console.error("Razorpay create-order error:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: msg,
    });
  }
});

// Verify payment and update fees (student only)
router.post("/verify", authMiddleware(["student"]), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feesId, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !feesId || amount == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const fees = await Fees.findById(feesId);
    if (!fees) {
      return res.status(404).json({ message: "Fees record not found" });
    }

    if (fees.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access to fees" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const payAmount = Number(amount);
    const newPaidAmount = (fees.paidAmount || 0) + payAmount;
    const status = newPaidAmount >= fees.amount ? "Paid" : "Partial";

    fees.paidAmount = newPaidAmount;
    fees.status = status;
    fees.paymentMethod = "Razorpay";
    fees.transactionId = razorpay_payment_id;
    fees.paymentDate = new Date();
    fees.updatedAt = new Date();
    await fees.save();

    res.json({
      message: "Payment verified and fees updated",
      fees,
      status,
    });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
    });
  }
});

module.exports = router;
