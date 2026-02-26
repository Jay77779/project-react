import React from "react";
import { FaChartLine } from "react-icons/fa";
import ManageMarks from "../components/ManageMarks";
import "./Marks.css";

function Marks() {
  const userRole = localStorage.getItem("role");

  if (userRole !== "teacher") {
    return (
      <div className="marks-page">
        <div className="marks-placeholder">
          <FaChartLine className="marks-icon" />
          <p>Marks management is available for teachers only. View your results in Result.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="marks-page">
      <div className="marks-header">
        <h1><FaChartLine /> Marks</h1>
        <p>Select a student, enter exam name and marks per subject, then save.</p>
      </div>
      <div className="marks-content">
        <ManageMarks />
      </div>
    </div>
  );
}

export default Marks;
