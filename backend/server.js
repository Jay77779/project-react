require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json()); // so we can send JSON data

// ✅ Import routes
const studentRoutes = require("./routes/studentRoutes");
const { router: authRoutes } = require("./routes/auth");
const attendanceRoutes = require("./routes/attendanceRoutes");
const feesRoutes = require("./routes/feesRoutes");
const stripeRoutes = require("./routes/stripeRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
app.use("/api/students", studentRoutes); // every API will start with /students
app.use("/api/subjects", subjectRoutes);
app.use("/api/auth", authRoutes); // authentication routes
app.use("/api/attendance", attendanceRoutes); // attendance routes
app.use("/api/fees", feesRoutes); // fees routes
app.use("/api/stripe", stripeRoutes); // Stripe payment routes
app.use("/api/razorpay", razorpayRoutes); // Razorpay payment routes

// ✅ Connect to MongoDB
const PORT = 5000;
mongoose
  .connect("mongodb://127.0.0.1:27017/studentdbupdated") // studentdb = database name
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));

