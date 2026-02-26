import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./TeacherAttendanceView.css";

function TeacherAttendanceView() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const token = localStorage.getItem("token");

  // Fetch attendance records marked by this teacher
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filterDate) params.append("date", filterDate);
      if (filterSubject) params.append("subject", filterSubject);
      if (filterStatus) params.append("status", filterStatus);

      const res = await axios.get(
        `http://localhost:5000/api/attendance/report?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAttendanceRecords(res.data);
    } catch (err) {
      console.error("Error fetching attendance records:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to fetch attendance records"
      );
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterSubject, filterStatus, token]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  // Get unique subjects from records
  const uniqueSubjects = [...new Set(attendanceRecords.map((r) => r.subject))];
  const uniqueStatuses = ["Present", "Absent", "Leave"];

  if (loading) {
    return <div className="loading">Loading attendance records...</div>;
  }

  return (
    <div className="teacher-attendance-view">
      <h2>Attendance Records Given</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="filterDate">Date:</label>
          <input
            type="date"
            id="filterDate"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filterSubject">Subject:</label>
          <select
            id="filterSubject"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {uniqueSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filterStatus">Status:</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <button className="refresh-btn" onClick={fetchAttendanceRecords}>
          Refresh
        </button>
      </div>

      {/* Attendance Table */}
      {attendanceRecords.length > 0 ? (
        <div className="attendance-table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr
                  key={record._id}
                  className={`status-${record.status.toLowerCase()}`}
                >
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td className="student-name">
                    {record.studentId?.name || "N/A"}
                  </td>
                  <td>{record.studentId?.email || "N/A"}</td>
                  <td>{record.studentId?.course || "N/A"}</td>
                  <td>{record.subject}</td>
                  <td>
                    <span
                      className={`status-badge status-${record.status.toLowerCase()}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>{record.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-records">
          <p>No attendance records found for the selected filters.</p>
        </div>
      )}

      <div className="record-count">
        Total Records: <strong>{attendanceRecords.length}</strong>
      </div>
    </div>
  );
}

export default TeacherAttendanceView;
