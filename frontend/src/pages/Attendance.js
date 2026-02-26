import React from "react";
import AttendanceGrid from "../components/AttendanceGrid";
import AttendanceReport from "../components/AttendanceReport";
import ApplyLeave from "../components/ApplyLeave";
import AttendanceRecord from "../components/AttendanceRecord";
import "./Attendance.css";

function Attendance() {
  const userRole = localStorage.getItem("role");

  return (
    <div className="attendance-page">
      {userRole === "teacher" ? (
        <div className="teacher-view">
          <h1>Attendance Management</h1>
          <div className="teacher-sections">
            <section className="attendance-section">
              <h2>Mark Attendance</h2>
              <AttendanceGrid />
            </section>
            <section className="attendance-section">
              <ApplyLeave />
            </section>
            <section className="attendance-section">
              <AttendanceReport />
            </section>
          </div>
        </div>
      ) : (
        <div className="student-view">
          <h1>My Attendance Record</h1>
          <AttendanceRecord />
        </div>
      )}
    </div>
  );
}

export default Attendance;
