const mongoose = require("mongoose");

// Define Fees schema
const feesSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Partial"],
    default: "Pending",
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paymentDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ["Online", "Cash", "Cheque", "Bank Transfer", "Stripe", "Razorpay"],
  },
  transactionId: {
    type: String,
  },
  remarks: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Fees", feesSchema);
