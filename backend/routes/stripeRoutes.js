const express = require("express");
const Stripe = require("stripe");
const { authMiddleware } = require("./auth");
const Fees = require("../models/fees");
const router = express.Router();

// Initialize Stripe with the secret key
const secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_51SdSvNPF19en5zSDAHUEhnPkLklLvMUErXpSeFgoecmVBaX9DB2SvczbrMwmtaeC29PACvTzcdPlp2XGLkQhcwJ90075ZQAy8l";
const stripe = new Stripe(secretKey);

console.log("✅ Stripe initialized");
console.log("   Secret Key:", secretKey ? `${secretKey.substring(0, 10)}...` : "NOT SET");

// Create Payment Intent
router.post("/create-payment-intent", authMiddleware(["student"]), async (req, res) => {
  try {
    const { amount, feesId, description } = req.body;

    console.log("📦 Create Payment Intent Request:", { amount, feesId });

    if (!amount || !feesId) {
      return res.status(400).json({ message: "Amount and feesId required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Verify the fees belongs to the student
    const fees = await Fees.findById(feesId);
    if (!fees) {
      console.log("❌ Fees record not found:", feesId);
      return res.status(404).json({ message: "Fees record not found" });
    }

    if (fees.studentId.toString() !== req.user.id) {
      console.log("❌ Unauthorized - fees doesn't belong to student");
      return res.status(403).json({ message: "Unauthorized access to fees" });
    }

    // Create Stripe Payment Intent (amount in cents: 1 USD = 100 cents)
    console.log("🔄 Creating Stripe payment intent...");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "inr", // Indian Rupees
      metadata: {
        feesId: feesId.toString(),
        studentId: req.user.id.toString(),
        course: fees.course,
        semester: fees.semester,
      },
      description: description || `Fee Payment for ${fees.course} - ${fees.semester}`,
    });

    console.log("✅ Payment Intent created:", paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("❌ Payment Intent creation error:", error.message);
    console.error("❌ Full error:", error);
    res.status(500).json({
      message: "Failed to create payment intent",
      error: error.message,
      type: error.type,
    });
  }
});

// Confirm Payment Intent
router.post("/confirm-payment", authMiddleware(["student"]), async (req, res) => {
  try {
    const { paymentIntentId, feesId, amount } = req.body;

    console.log("💰 Confirm Payment Request:", { paymentIntentId, feesId, amount });

    if (!paymentIntentId || !feesId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Verify the fees belongs to the student
    const fees = await Fees.findById(feesId);
    if (!fees) {
      console.log("❌ Fees not found:", feesId);
      return res.status(404).json({ message: "Fees record not found" });
    }

    if (fees.studentId.toString() !== req.user.id) {
      console.log("❌ Unauthorized access - student ID mismatch");
      return res.status(403).json({ message: "Unauthorized access to fees" });
    }

    // Retrieve payment intent from Stripe to verify
    console.log("🔍 Retrieving payment intent from Stripe...");
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("📊 Payment Intent Status:", paymentIntent.status);

    if (paymentIntent.status !== "succeeded") {
      console.log("❌ Payment not succeeded. Current status:", paymentIntent.status);
      return res.status(400).json({
        message: `Payment not confirmed. Status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      });
    }

    // Update fees with payment details
    const newPaidAmount = (fees.paidAmount || 0) + amount;
    const status = newPaidAmount >= fees.amount ? "Paid" : "Partial";

    fees.paidAmount = newPaidAmount;
    fees.status = status;
    fees.paymentMethod = "Stripe";
    fees.transactionId = paymentIntentId;
    fees.updatedAt = new Date();

    await fees.save();

    console.log("✅ Fees updated successfully:", {
      status,
      paidAmount: newPaidAmount,
      totalAmount: fees.amount,
    });

    res.json({
      message: "Payment confirmed and fees updated",
      fees: fees,
      status: status,
    });
  } catch (error) {
    console.error("❌ Payment confirmation error:", error.message);
    console.error("❌ Error details:", error);
    res.status(500).json({
      message: "Payment confirmation failed",
      error: error.message,
      details: error.raw ? error.raw.message : error.message,
    });
  }
});

module.exports = router;
