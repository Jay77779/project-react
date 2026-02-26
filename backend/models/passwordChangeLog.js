const mongoose = require("mongoose");

const passwordChangeLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    method: {
      type: String,
      enum: ["student-otp", "admin-reset"],
      default: "student-otp",
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("PasswordChangeLog", passwordChangeLogSchema);

