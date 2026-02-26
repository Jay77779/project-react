import React, { useState, useEffect } from "react";
import axios from "axios";
import "./FeesManagement.css";

function FeesManagement() {
  const [fees, setFees] = useState([]);
  const [, setStats] = useState({
    totalFeesDue: 0,
    totalCollected: 0,
    outstandingAmount: 0,
    collectionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState("all");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "Online",
    transactionId: "",
  });
  const [courses, setCourses] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [editData, setEditData] = useState({
    amount: "",
    dueDate: "",
  });
  const token = localStorage.getItem("token");

  // Fetch all fees and stats
  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true);
        const [feesRes, statsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/fees/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/fees/summary/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        console.log("Fees data:", feesRes.data);
        console.log("Stats:", statsRes.data);

        setFees(feesRes.data);
        setStats(statsRes.data);

        // Extract unique courses
        const uniqueCourses = [
          ...new Set(feesRes.data.map((fee) => fee.course)),
        ];
        setCourses(uniqueCourses);
      } catch (error) {
        console.error("Error fetching fees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [token]);

  // Filter and group fees by course and semester
  const filteredFees = (() => {
    let filtered = fees.filter((fee) => {
      if (activeTab !== "all" && fee.status !== activeTab) return false;
      if (filterCourse && fee.course !== filterCourse) return false;
      if (filterStatus && fee.status !== filterStatus) return false;
      return true;
    });

    // Group by course and semester, showing one entry per course-semester combination
    const grouped = {};
    filtered.forEach((fee) => {
      const key = `${fee.course}-${fee.semester}`;
      if (!grouped[key]) {
        grouped[key] = {
          _id: key,
          course: fee.course,
          semester: fee.semester,
          amount: fee.amount,
          status: fee.status,
          dueDate: fee.dueDate,
          firstFeeId: fee._id, // Store first fee ID for payment recording
        };
      }
    });

    return Object.values(grouped);
  })();

  const openPaymentModal = (groupedFee) => {
    // Find all fees for this course and semester
    const feesForGroup = fees.filter(
      (fee) => fee.course === groupedFee.course && fee.semester === groupedFee.semester
    );
    
    // Use the first one as reference (all in same group have same amount)
    const firstFee = feesForGroup[0];
    setSelectedFee(firstFee);
    setPaymentData({
      amount: firstFee.amount - firstFee.paidAmount,
      paymentMethod: "Online",
      transactionId: "",
    });
    setPaymentModal(true);
  };

  const closePaymentModal = () => {
    setPaymentModal(false);
    setSelectedFee(null);
    setPaymentData({ amount: "", paymentMethod: "Online", transactionId: "" });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || paymentData.amount <= 0) {
      alert("❌ Please enter a valid amount");
      return;
    }

    try {
      console.log("Submitting payment with paidAmount:", parseFloat(paymentData.amount));
      const response = await axios.post(
        `http://localhost:5000/api/fees/payment/${selectedFee._id}`,
        {
          paidAmount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          transactionId: paymentData.transactionId || "",
          remarks: "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Payment recorded:", response.data);

      // Update fees list
      setFees(
        fees.map((fee) =>
          fee._id === selectedFee._id ? response.data : fee
        )
      );

      // Refresh stats
      try {
        const statsRes = await axios.get(
          "http://localhost:5000/api/fees/summary/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStats(statsRes.data);
      } catch (statError) {
        console.error("Error refreshing stats:", statError);
      }

      alert("✅ Payment recorded successfully!");
      closePaymentModal();
    } catch (error) {
      console.error("Error recording payment:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to record payment"
      );
    }
  };

  const openEditModal = (groupedFee) => {
    // Find all fees for this course and semester
    const feesForGroup = fees.filter(
      (fee) => fee.course === groupedFee.course && fee.semester === groupedFee.semester
    );
    const firstFee = feesForGroup[0];
    
    setEditingFee(firstFee);
    setEditData({
      amount: firstFee.amount,
      dueDate: firstFee.dueDate.split("T")[0],
    });
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditingFee(null);
    setEditData({ amount: "", dueDate: "" });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData.amount || editData.amount <= 0) {
      alert("❌ Please enter a valid amount");
      return;
    }

    try {
      console.log("Updating fee:", editingFee._id, editData);

      const response = await axios.put(
        `http://localhost:5000/api/fees/${editingFee._id}`,
        {
          amount: parseFloat(editData.amount),
          dueDate: editData.dueDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Fee updated:", response.data);

      // Update fees list
      setFees(
        fees.map((fee) =>
          fee._id === editingFee._id ? response.data : fee
        )
      );

      alert("✅ Fees updated successfully!");
      closeEditModal();
    } catch (error) {
      console.error("Error updating fees:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update fees"
      );
    }
  };

  const handleDeleteFees = async (groupedFee) => {
    if (
      !window.confirm(
        `Are you sure you want to delete all fees for ${groupedFee.course} - Semester ${groupedFee.semester}?`
      )
    ) {
      return;
    }

    try {
      // Find all fees for this course and semester
      const feesForGroup = fees.filter(
        (fee) => fee.course === groupedFee.course && fee.semester === groupedFee.semester
      );

      // Delete all fees in this group
      await Promise.all(
        feesForGroup.map((fee) =>
          axios.delete(`http://localhost:5000/api/fees/${fee._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      // Remove from state
      setFees(fees.filter((fee) => !feesForGroup.includes(fee)));

      alert("✅ Fees deleted successfully!");
    } catch (error) {
      console.error("Error deleting fees:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to delete fees"
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "#28a745";
      case "Partial":
        return "#ffc107";
      case "Pending":
        return "#dc3545";
      default:
        return "#666";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "Paid":
        return "#d4edda";
      case "Partial":
        return "#fff3cd";
      case "Pending":
        return "#f8d7da";
      default:
        return "#e2e3e5";
    }
  };

  if (loading) {
    return <div className="loading">Loading fees data...</div>;
  }

  return (
    <div className="fees-management">
      {/* Filters */}
      <div className="fees-filters">
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="filter-select"
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Fees Table */}
      <div className="fees-table-section">
        <h3>Fee Records</h3>
        <div className="table-info">
          Showing {filteredFees.length} of {fees.length} records
        </div>
        {filteredFees.length > 0 ? (
          <table className="fees-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Semester</th>
                <th>Created Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFees.map((fee) => (
                <tr key={fee._id}>
                  <td><strong>{fee.course}</strong></td>
                  <td><strong>{fee.semester}</strong></td>
                  <td className="amount">₹{fee.amount.toLocaleString()}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusBgColor(fee.status),
                        color: getStatusColor(fee.status),
                      }}
                    >
                      {fee.status}
                    </span>
                  </td>
                  <td>{new Date(fee.dueDate).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-pay"
                        onClick={() => openPaymentModal(fee)}
                      >
                        Pay
                      </button>
                      <button
                        className="btn-edit"
                        onClick={() => openEditModal(fee)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteFees(fee)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">No fee records found matching your filters.</div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && selectedFee && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="btn-close" onClick={closePaymentModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="payment-info">
                <div className="info-row">
                  <span className="info-label">Student:</span>
                  <span className="info-value">
                    {selectedFee.studentId?.name}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Course:</span>
                  <span className="info-value">{selectedFee.course}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total Fee:</span>
                  <span className="info-value">
                    ₹{selectedFee.amount.toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Already Paid:</span>
                  <span className="info-value paid">
                    ₹{selectedFee.paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="info-row highlight">
                  <span className="info-label">Pending:</span>
                  <span className="info-value pending">
                    ₹{(selectedFee.amount - selectedFee.paidAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="payment-form">
                <div className="form-group">
                  <label>Payment Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    min="0"
                    step="100"
                    max={selectedFee.amount - selectedFee.paidAmount}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value,
                      }))
                    }
                  >
                    <option value="Online">Online</option>
                    <option value="Check">Check</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Transaction ID (Optional)</label>
                  <input
                    type="text"
                    value={paymentData.transactionId}
                    onChange={(e) =>
                      setPaymentData((prev) => ({
                        ...prev,
                        transactionId: e.target.value,
                      }))
                    }
                    placeholder="Enter transaction ID or reference number"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={closePaymentModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && editingFee && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Fees</h3>
              <button className="btn-close" onClick={closeEditModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="payment-info">
                <div className="info-row">
                  <span className="info-label">Course:</span>
                  <span className="info-value">{editingFee.course}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Semester:</span>
                  <span className="info-value">{editingFee.semester}</span>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="payment-form">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    value={editData.amount}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    min="0"
                    step="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={editData.dueDate}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Update Fees
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeesManagement;


/*
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusBgColor(fee.status),
                        color: getStatusColor(fee.status),
                      }}
                    >
                      {fee.status}
                    </span>
                  </td>



                  */