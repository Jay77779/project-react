/*
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./StudentFeesView.css";

const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51SdSvNPF19en5zSD3lNQULPn4r4OMNoq0aobIfuyg3EgKjcEvGFgUnNImhr21GU4Ac4nMaQC4ghrQW45TUrPSz9k00q3sHxK0m";

function StudentFeesView() {
  const token = localStorage.getItem("token");

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDue, setTotalDue] = useState(0);

  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [clientSecret, setClientSecret] = useState(null);


  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          "http://localhost:5000/api/fees/me",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let feesArray = Array.isArray(res.data)
          ? res.data
          : res.data.fees || [];

        const latestFees = {};
        feesArray.forEach((fee) => {
          const key = `${fee.course}-${fee.semester}`;
          if (
            !latestFees[key] ||
            new Date(fee.createdAt) > new Date(latestFees[key].createdAt)
          ) {
            latestFees[key] = fee;
          }
        });

        feesArray = Object.values(latestFees).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setFees(feesArray);

        const total = feesArray.reduce(
          (sum, fee) => sum + (fee.amount - fee.paidAmount),
          0
        );
        setTotalDue(total);
      } catch (err) {
        console.error("Error fetching fees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [token]);


const openPaymentModal = async (fee) => {
  setSelectedFee(fee);
  setPaymentData({ amount: fee.amount - fee.paidAmount });
  setPaymentModal(true);
  setMessage("");

  try {
    const res = await axios.post(
      "http://localhost:5000/api/stripe/create-payment-intent",
      {
        amount: fee.amount - fee.paidAmount,
        feesId: fee._id,
        description: `Fees - ${fee.course} Semester ${fee.semester}`,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { clientSecret } = res.data;

    const elementsInstance = stripe.elements({ clientSecret });
    setElements(elementsInstance);

    const paymentEl = elementsInstance.create("payment");
    setPaymentElement(paymentEl);

    setTimeout(() => {
      paymentEl.mount("#payment-element");
    }, 100);

  } catch (err) {
    console.error(err);
    setMessage("Failed to initialize payment");
    setMessageType("error");
  }
};



  const closePaymentModal = () => {
    if (paymentElement) {
      paymentElement.unmount();
    }
    setPaymentElement(null);
    setElements(null);
    setClientSecret(null);
    setPaymentModal(false);
    setSelectedFee(null);
    setPaymentData({ amount: "" });
    setMessage("");
  };


  const handlePaymentSubmit = async (e) => {
  e.preventDefault();

  if (!stripe || !elements) return;

  setIsProcessing(true);
  setMessage("");

  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/fees`,
    },
    redirect: "if_required",
  });

  if (error) {
    setMessage(error.message);
    setMessageType("error");
    setIsProcessing(false);
    return;
  }

  if (paymentIntent.status === "succeeded") {
    await axios.post(
      "http://localhost:5000/api/stripe/confirm-payment",
      {
        paymentIntentId: paymentIntent.id,
        feesId: selectedFee._id,
        amount: paymentData.amount,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setMessage("✅ Payment successful");
    setMessageType("success");
    setTimeout(closePaymentModal, 1500);
  }

  setIsProcessing(false);
};


  if (loading) return <div className="loading">Loading fees...</div>;

  return (
    <div className="student-fees-view">
      <div className="amount-due-card">
        <div>Total Due</div>
        <div className="amount-value">₹{totalDue.toLocaleString()}</div>

        {totalDue > 0 ? (
          <button onClick={() => openPaymentModal(fees[0])}>
            Pay Fees
          </button>
        ) : (
          <div>✅ All fees paid</div>
        )}
      </div>

      {paymentModal && selectedFee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Pay Fees</h3>

            {message && (
              <div className={`alert alert-${messageType}`}>
                {message}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit}>
              <input
                type="number"
                value={paymentData.amount}
                disabled
              />

              <div id="payment-element" />

              <button disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Pay"}
              </button>

              <button type="button" onClick={closePaymentModal}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentFeesView;
*/


















/*


import React, { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import jsPDF from "jspdf";
import "./StudentFeesView.css";

const stripePromise = loadStripe(
  "pk_test_51SdSvNPF19en5zSD3lNQULPn4r4OMNoq0aobIfuyg3EgKjcEvGFgUnNImhr21GU4Ac4nMaQC4ghrQW45TUrPSz9k00q3sHxK0m"
);

function StudentFeesView() {
  const token = localStorage.getItem("token");

  const [fees, setFees] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedFee, setSelectedFee] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // ================= FETCH FEES =================
  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/fees/me",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const feesArray = Array.isArray(res.data)
        ? res.data
        : res.data.fees || [];

      setFees(feesArray);

      const due = feesArray.reduce(
        (sum, f) => sum + (f.amount - f.paidAmount),
        0
      );
      setTotalDue(due);
    } catch (err) {
      console.error("Fetch fees error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  // ================= OPEN PAYMENT =================
  const openPaymentModal = async (fee) => {
    setSelectedFee(fee);
    setPaymentModal(true);
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/stripe/create-payment-intent",
        {
          amount: fee.amount - fee.paidAmount,
          feesId: fee._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClientSecret(res.data.clientSecret);
    } catch (err) {
      console.error(err);
      setMessage("Unable to start payment");
      setMessageType("error");
    }
  };

  const closePaymentModal = () => {
    setPaymentModal(false);
    setClientSecret(null);
    setSelectedFee(null);
  };

  // ================= RECEIPT PDF =================
  const downloadReceipt = (fee) => {
    const makePdf = (imgData) => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header: try to use logo if available
      if (imgData) {
        try {
          doc.addImage(imgData, "PNG", 40, 12, 60, 60);
        } catch (e) {
          console.warn("Failed to add logo to PDF:", e);
        }
        doc.setFontSize(20);
        doc.setTextColor(34, 34, 34);
        doc.setFont("helvetica", "bold");
        doc.text("Student Corner", 110, 38);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Jahangirpura, Surat - 935401", 110, 54);
      } else {
        // Fallback header bar
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, pageWidth, 60, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Student Corner", 40, 38);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Jahangirpura, Surat - 935401", 40, 54);
      }

      // Title on right
      doc.setTextColor(34, 34, 34);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Fee Payment Receipt", pageWidth - 220, 38);

      // Transaction box
      const startY = 90;
      doc.setDrawColor(200);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(36, startY - 10, pageWidth - 72, 70, 6, 6, "F");

      doc.setFontSize(11);
      doc.setTextColor(70, 70, 70);
      doc.text(`Transaction ID: ${fee.transactionId || "-"}`, 50, startY + 6);
      doc.text(
        `Date: ${fee.updatedAt ? new Date(fee.updatedAt).toLocaleString() : "-"}`,
        50,
        startY + 26
      );
      doc.text(`Payment Method: ${fee.paymentMethod || "Stripe"}`, 50, startY + 46);

      // Receipt table header
      const tableY = startY + 100;
      const colX = [50, pageWidth - 200, pageWidth - 110];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Description", colX[0], tableY);
      doc.text("Amount (₹)", colX[1], tableY);
      doc.text("Status", colX[2], tableY);

      doc.setDrawColor(220);
      doc.line(46, tableY + 6, pageWidth - 46, tableY + 6);

      // Row with fee details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const rowY = tableY + 28;
      const description = `${fee.course} - Semester ${fee.semester}`;
      doc.text(description, colX[0], rowY);

      const amountStr = `₹${(fee.paidAmount || 0).toLocaleString()}`;
      doc.text(amountStr, colX[1], rowY);

      const statusStr = fee.status || (fee.paidAmount >= fee.amount ? "Paid" : "Partial");
      doc.text(statusStr, colX[2], rowY);

      // Totals box
      const totalsY = rowY + 36;
      doc.setFontSize(11);
      doc.text("Total Amount:", colX[1] - 80, totalsY);
      doc.setFont("helvetica", "bold");
      doc.text(`₹${(fee.amount || 0).toLocaleString()}`, colX[1], totalsY);

      doc.setFont("helvetica", "normal");

      // Footer note
      const footerY = 780;
      doc.setDrawColor(230);
      doc.line(36, footerY - 20, pageWidth - 36, footerY - 20);
      doc.setFontSize(10);
      doc.text(
        "This is a system generated receipt. For queries contact accounts@studentcorner.edu",
        40,
        footerY
      );

      // Save PDF
      const filename = `Fee_Receipt_${fee.transactionId || Date.now()}.pdf`;
      doc.save(filename);
    };

    // Try load logo from public folder (/logo.png). If not present, fallback to styled header.
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/logo.png";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL("image/png");
          makePdf(imgData);
        } catch (e) {
          console.warn("Could not convert logo to DataURL, generating PDF without logo", e);
          makePdf(null);
        }
      };
      img.onerror = () => {
        makePdf(null);
      };
    } catch (e) {
      console.warn("Logo load failed, generating PDF without logo", e);
      makePdf(null);
    }
  };

  const unpaidFee = fees.find(
    (f) => f.amount > f.paidAmount
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="student-fees-view">
      
      <div className="amount-due-card">
        <h3>Total Amount Due</h3>
        <h2>₹{totalDue.toLocaleString()}</h2>

        {unpaidFee ? (
          <button
            className="btn-pay"
            onClick={() => openPaymentModal(unpaidFee)}
          >
            Pay Fees
          </button>
        ) : (
          <div className="paid-status">✅ All fees paid</div>
        )}
      </div>

      
      {fees.length > 0 && (
        <div className="fees-table">
          <h3>My Fees</h3>
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Semester</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => {
                const due = fee.amount - fee.paidAmount;
                return (
                  <tr key={fee._id}>
                    <td>{fee.course}</td>
                    <td>{fee.semester}</td>
                    <td>₹{fee.amount}</td>
                    <td>₹{fee.paidAmount}</td>
                    <td>₹{due}</td>
                    <td className={due === 0 ? "success" : "pending"}>
                      {due === 0 ? "Paid" : "Pending"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      
      {fees.some((f) => f.status === "Paid") && (
        <div className="payment-history">
          <h3>Payment History</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Amount Paid</th>
                <th>Method</th>
                <th>Transaction</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {fees
                .filter((f) => f.status === "Paid")
                .map((fee) => (
                  <tr key={fee._id}>
                    <td>
                      {new Date(fee.updatedAt).toLocaleDateString()}
                    </td>
                    <td>{fee.course}</td>
                    <td>{fee.semester}</td>
                    <td>₹{fee.paidAmount}</td>
                    <td>{fee.paymentMethod}</td>
                    <td>{fee.transactionId}</td>
                    <td>
                      <button
                        className="btn-receipt"
                        onClick={() => downloadReceipt(fee)}
                      >
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      
      {paymentModal && clientSecret && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={closePaymentModal}>
              ✕
            </button>

            {message && (
              <div className={`alert ${messageType}`}>
                {message}
              </div>
            )}

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                closeModal={closePaymentModal}
                refreshFees={fetchFees}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= CHECKOUT FORM =================

function CheckoutForm({ closeModal, refreshFees }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else {
      await refreshFees();
      closeModal();
    }
  };


  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="error">{error}</div>}
      <button disabled={processing} className="btn-submit">
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export default StudentFeesView;
*/














import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import "./StudentFeesView.css";
import { jsPDF } from "jspdf";


const stripePromise = loadStripe(
  "pk_test_51SdSvNPF19en5zSD3lNQULPn4r4OMNoq0aobIfuyg3EgKjcEvGFgUnNImhr21GU4Ac4nMaQC4ghrQW45TUrPSz9k00q3sHxK0m"
);

function StudentFeesView() {
  const token = localStorage.getItem("token");

  const [fees, setFees] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedFee, setSelectedFee] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payingRazorpay, setPayingRazorpay] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const API_BASE = "http://localhost:5000";
  const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_S66eNWEbdZYzjX";

  // ================= FETCH FEES =================
  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/fees/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const feesArray = Array.isArray(res.data) ? res.data : res.data.fees || [];
      setFees(feesArray);

      const due = feesArray.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
      setTotalDue(due);
    } catch (err) {
      console.error("Fetch fees error", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  // ================= RAZORPAY PAYMENT =================
  const payWithRazorpay = async (fee) => {
    const amount = fee.amount - (fee.paidAmount || 0);
    if (amount <= 0) return;

    setMessage("");
    setMessageType("");
    setSuccessMsg("");
    setPayingRazorpay(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/razorpay/create-order`,
        { amount, feesId: fee._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount: amountInPaise, keyId, currency } = res.data;

      const options = {
        key: keyId || RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: currency || "INR",
        order_id: orderId,
        name: "Student Corner",
        description: `Fees - ${fee.course} Semester ${fee.semester}`,
        handler: async (response) => {
          try {
            await axios.post(
              `${API_BASE}/api/razorpay/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                feesId: fee._id,
                amount,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccessMsg("✅ Payment successful!");
            fetchFees();
          } catch (err) {
            setMessage(err.response?.data?.message || "Payment verification failed");
            setMessageType("error");
          } finally {
            setPayingRazorpay(false);
          }
        },
        modal: {
          ondismiss: () => setPayingRazorpay(false),
        },
      };

      const rzp = window.Razorpay ? new window.Razorpay(options) : null;
      if (rzp) {
        rzp.open();
      } else {
        setMessage("Razorpay failed to load. Please refresh the page.");
        setMessageType("error");
        setPayingRazorpay(false);
      }
    } catch (err) {
      console.error(err);
      const data = err.response?.data || {};
      const errorMsg = data.error || data.message || "Unable to start payment";
      setMessage(errorMsg);
      setMessageType("error");
      setPayingRazorpay(false);
    }
  };

  // ================= OPEN PAYMENT (Stripe modal - optional) =================
  const openPaymentModal = async (fee) => {
    setSelectedFee(fee);
    setPaymentModal(true);
    setMessage("");
    setMessageType("");
    setSuccessMsg("");

    try {
      const res = await axios.post(
        `${API_BASE}/api/stripe/create-payment-intent`,
        {
          amount: fee.amount - fee.paidAmount,
          feesId: fee._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClientSecret(res.data.clientSecret);
    } catch (err) {
      console.error(err);
      setMessage("Unable to start payment");
      setMessageType("error");
    }
  };

  const closePaymentModal = () => {
    setPaymentModal(false);
    setClientSecret(null);
    setSelectedFee(null);
  };

  // ================= RECEIPT PDF =================
/*
  const downloadReceipt = (fee) => {
    const makePdf = (imgData) => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      if (imgData) {
        try { doc.addImage(imgData, "PNG", 40, 12, 60, 60); } catch (e) {}
        doc.setFontSize(20);
        doc.setTextColor(34,34,34);
        doc.setFont("helvetica", "bold");
        doc.text("Student Corner", 110, 38);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Jahangirpura, Surat - 935401", 110, 54);
      } else {
        doc.setFillColor(102,126,234);
        doc.rect(0,0,pageWidth,60,"F");
        doc.setTextColor(255,255,255);
        doc.setFontSize(20);
        doc.setFont("helvetica","bold");
        doc.text("Student Corner",40,38);
        doc.setFontSize(10);
        doc.setFont("helvetica","normal");
        doc.text("Jahangirpura, Surat - 935401",40,54);
      }

      doc.setTextColor(34,34,34);
      doc.setFontSize(16);
      doc.setFont("helvetica","bold");
      doc.text("Fee Payment Receipt", pageWidth-220,38);

      const startY = 90;
      doc.setDrawColor(200);
      doc.setFillColor(245,245,245);
      doc.roundedRect(36, startY-10, pageWidth-72, 70, 6,6,"F");

      doc.setFontSize(11);
      doc.setTextColor(70,70,70);
      doc.text(`Transaction ID: ${fee.transactionId || "-"}`, 50, startY+6);
      doc.text(`Date: ${fee.updatedAt ? new Date(fee.updatedAt).toLocaleString() : "-"}`, 50, startY+26);
      doc.text(`Payment Method: ${fee.paymentMethod || "Stripe"}`, 50, startY+46);

      const tableY = startY + 100;
      const colX = [50, pageWidth-200, pageWidth-110];

      doc.setFont("helvetica","bold");
      doc.setFontSize(12);
      doc.text("Description", colX[0], tableY);
      doc.text("Amount (₹)", colX[1], tableY);
      doc.text("Status", colX[2], tableY);

      doc.setDrawColor(220);
      doc.line(46, tableY+6, pageWidth-46, tableY+6);

      const rowY = tableY+28;
      const description = `${fee.course} - Semester ${fee.semester}`;
      doc.setFont("helvetica","normal");
      doc.setFontSize(11);
      doc.text(description, colX[0], rowY);
      doc.text(`₹${(fee.paidAmount || 0).toLocaleString()}`, colX[1], rowY);
      doc.text(fee.status || "Paid", colX[2], rowY);

      const totalsY = rowY + 36;
      doc.setFontSize(11);
      doc.text("Total Amount:", colX[1]-80, totalsY);
      doc.setFont("helvetica","bold");
      doc.text(`₹${(fee.amount || 0).toLocaleString()}`, colX[1], totalsY);
      

      const footerY = 780;
      doc.setDrawColor(230);
      doc.line(36, footerY-20, pageWidth-36, footerY-20);
      doc.setFontSize(10);
      doc.text("This is a system generated receipt. For queries contact accounts@studentcorner.edu",40,footerY);

      const filename = `Fee_Receipt_${fee.transactionId || Date.now()}.pdf`;
      doc.save(filename);
    };

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/logo.png";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0);
        const imgData = canvas.toDataURL("image/png");
        makePdf(imgData);
      };
      img.onerror = () => makePdf(null);
    } catch(e) { makePdf(null); }
  };
*/
const downloadReceipt = (fee) => {
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 720;

  const makePdf = (logoImg, stampImg, signImg) => {
    const doc = new jsPDF({
      unit: "pt",
      format: [PAGE_WIDTH, PAGE_HEIGHT],
    });

    // ================= HEADER =================
    if (logoImg) doc.addImage(logoImg, "PNG", 40, 20, 55, 55);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Student Corner", 110, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Jahangirpura, Surat - 395005", 110, 58);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Fee Payment Receipt", PAGE_WIDTH - 220, 42);

    // ================= INFO BOX =================
    const infoY = 100;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(36, infoY - 25, PAGE_WIDTH - 72, 85, 6, 6, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(70);
    doc.text(`Transaction ID: ${fee.transactionId || "-"}`, 50, infoY);
    doc.text(
      `Date: ${fee.updatedAt ? new Date(fee.updatedAt).toLocaleString() : "-"}`,
      50,
      infoY + 22
    );
    doc.text(`Payment Method: ${fee.paymentMethod || "Razorpay"}`, 50, infoY + 44);

    // ================= FEE DATA =================
    const fetchedAmount = fee.paidAmount || 0;
    const collegeFee = fetchedAmount / 2;
    const tuitionFee = fetchedAmount / 2;

    const feeData = [
      { name: "College Fees", amount: collegeFee },
      { name: "Tuition Fee", amount: tuitionFee },
      { name: "Bus Fee", amount: 0 },
      { name: "Library / Lab Fee", amount: 0 },
      { name: "Diary", amount: 0 },
      { name: "Extra Curricular Fee", amount: 0 },
      { name: "I-Card", amount: 0 },
    ];

    const totalAmount = feeData.reduce((s, f) => s + f.amount, 0);

    // ================= TABLE =================
    const tableY = infoY + 110;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("S.No", 50, tableY);
    doc.text("Fee Head", 100, tableY);
    doc.text("Amount (Rs.)", PAGE_WIDTH - 100, tableY, { align: "right" });

    doc.line(36, tableY + 6, PAGE_WIDTH - 36, tableY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    let y = tableY + 28;

    feeData.forEach((item, index) => {
      doc.text(String(index + 1), 50, y);
      doc.text(item.name, 100, y);
      doc.text(item.amount.toFixed(2), PAGE_WIDTH - 100, y, {
        align: "right",
      });
      y += 22;
    });

    doc.line(36, y, PAGE_WIDTH - 36, y);

    // ================= TOTAL =================
    y += 25;
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", PAGE_WIDTH - 250, y);
    doc.text(`Rs. ${totalAmount.toFixed(2)}`, PAGE_WIDTH - 100, y, {
      align: "right",
    });

    // ================= FOOTER =================
    const footerY = PAGE_HEIGHT - 70;
    doc.setDrawColor(220);
    doc.line(36, footerY - 70, PAGE_WIDTH - 36, footerY - 70);

    if (stampImg) doc.addImage(stampImg, "PNG", 50, footerY - 65, 85, 85);
    if (signImg)
      doc.addImage(signImg, "PNG", PAGE_WIDTH - 210, footerY - 70, 140, 45);

    doc.setDrawColor(0);
    doc.line(PAGE_WIDTH - 230, footerY - 25, PAGE_WIDTH - 50, footerY - 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Authorized Signature", PAGE_WIDTH - 190, footerY - 8);

    // ================= NOTE =================
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "This is a system generated receipt. No physical signature required.",
      40,
      PAGE_HEIGHT - 20
    );

    doc.save(`Fee_Receipt_${fee.transactionId || Date.now()}.pdf`);
  };

  // ================= IMAGE LOADER =================
  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
    });

  Promise.all([
    loadImage("/logo.png"),
    loadImage("/stamp.png"),
    loadImage("/signature.png"),
  ]).then(([logo, stamp, sign]) => makePdf(logo, stamp, sign));
};


 


  const unpaidFee = fees.find(f => f.amount > f.paidAmount);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="student-fees-view">
      {successMsg && <div className="success">{successMsg}</div>}
      {message && <div className={`alert alert-${messageType}`}>{message}</div>}

      <div className="amount-due-card">
        <h3>Total Amount Due</h3>
        <h2>₹{totalDue.toLocaleString()}</h2>
        {unpaidFee ? (
          <>
            <button
              className="btn-pay"
              onClick={() => payWithRazorpay(unpaidFee)}
              disabled={payingRazorpay}
            >
              {payingRazorpay ? "Opening Razorpay..." : "Pay with Razorpay"}
            </button>
          </>
        ) : (
          <div className="paid-status">✅ All fees paid</div>
        )}
      </div>

      {fees.length > 0 && (
        <div className="fees-table">
          <h3>My Fees</h3>
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Semester</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Pay</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(fee => {
                const due = fee.amount - (fee.paidAmount || 0);
                return (
                  <tr key={fee._id}>
                    <td>{fee.course}</td>
                    <td>{fee.semester}</td>
                    <td>₹{fee.amount}</td>
                    <td>₹{fee.paidAmount ?? 0}</td>
                    <td>₹{due}</td>
                    <td className={due===0 ? "success" : "pending"}>{due===0?"Paid":"Pending"}</td>
                    <td>
                      {due > 0 ? (
                        <button
                          type="button"
                          className="btn-pay-row"
                          onClick={() => payWithRazorpay(fee)}
                          disabled={payingRazorpay}
                        >
                          Pay (Razorpay)
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {fees.some(f=>f.status==="Paid") && (
        <div className="payment-history">
          <h3>Payment History</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Amount Paid</th>
                <th>Method</th>
                <th>Transaction</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {fees.filter(f=>f.status==="Paid").map(fee=>(
                <tr key={fee._id}>
                  <td>{new Date(fee.updatedAt).toLocaleDateString()}</td>
                  <td>{fee.course}</td>
                  <td>{fee.semester}</td>
                  <td>₹{fee.paidAmount}</td>
                  <td>{fee.paymentMethod}</td>
                  <td>{fee.transactionId}</td>
                  <td>
                    <button className="btn-receipt" onClick={()=>downloadReceipt(fee)}>Download PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paymentModal && clientSecret && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={closePaymentModal}>✕</button>
            {message && <div className={`alert ${messageType}`}>{message}</div>}
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                closeModal={closePaymentModal}
                refreshFees={fetchFees}
                selectedFee={selectedFee}
                setSuccessMsg={setSuccessMsg}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= CHECKOUT FORM =================
function CheckoutForm({ closeModal, refreshFees, selectedFee, setSuccessMsg }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setError(error.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // ✅ Call backend to update fee record
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:5000";
        await axios.post(
          `${apiBase}/api/stripe/confirm-payment`,
          {
            paymentIntentId: paymentIntent.id,
            feesId: selectedFee._id,
            amount: selectedFee.amount - selectedFee.paidAmount,
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        await refreshFees();
        setSuccessMsg("✅ Payment successful!");
        closeModal();
      }
    } catch (err) {
      console.error(err);
      setError("Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="error">{error}</div>}
      <button disabled={processing} className="btn-submit">
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export default StudentFeesView;
