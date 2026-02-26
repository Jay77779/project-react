import React from "react";
import FeesForm from "../components/FeesForm";
import StudentFeesView from "../components/StudentFeesView";
import FeesManagement from "../components/FeesManagement";
import "./Fees.css";

function Fees() {
  const userRole = localStorage.getItem("role");

  return (
    <div className="fees-page">
      <div className="fees-header">
        <h1>Fees Management</h1>
        <p>
          {userRole === "teacher"
            ? "Create and manage student fees, record payments, and track collection status"
            : "View your fee records and payment status"}
        </p>
      </div>

      <div className="fees-content">
        {userRole === "teacher" ? (
          <>
            {/* Teacher View */}
            <div className="fees-section">
              <div className="section-title">
                <h2>Create New Fee</h2>
              </div>
              <FeesForm />
            </div>

            <div className="fees-section">
              <div className="section-title">
                <h2>Manage Fees & Payments</h2>
              </div>
              <FeesManagement />
            </div>
          </>
        ) : (
          <>
            {/* Student View */}
            <div className="fees-section">
              <div className="section-title">
                <h2>My Fees</h2>
              </div>
              <StudentFeesView />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Fees;
