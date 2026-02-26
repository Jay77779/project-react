import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./AttendanceRecord.css";

const API_BASE = "http://localhost:5000/api";

function getDateStr(d) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function AttendanceRecord() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  const fetchMyAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_BASE}/attendance/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const records = Array.isArray(res.data) ? res.data : [];
      setAttendanceRecords(records);
      if (records.length > 0 && records[0].studentId?.name) {
        setStudentName(records[0].studentId.name);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to fetch attendance records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyAttendance();
  }, [fetchMyAttendance]);

  const recordsForMonth = React.useMemo(() => {
    return attendanceRecords.filter((r) => getDateStr(r.date).slice(0, 7) === monthYear);
  }, [attendanceRecords, monthYear]);

  const bySubjectAndDate = React.useMemo(() => {
    const map = {};
    recordsForMonth.forEach((r) => {
      const sub = r.subject || "";
      const d = getDateStr(r.date);
      if (!map[sub]) map[sub] = {};
      map[sub][d] = r.status;
    });
    return map;
  }, [recordsForMonth]);

  const uniqueDates = React.useMemo(() => {
    const set = new Set();
    recordsForMonth.forEach((r) => set.add(getDateStr(r.date)));
    return Array.from(set).sort();
  }, [recordsForMonth]);

  const subjects = Object.keys(bySubjectAndDate).sort();

  const summary = React.useMemo(() => {
    let present = 0;
    let leave = 0;
    let absent = 0;
    subjects.forEach((sub) => {
      uniqueDates.forEach((d) => {
        const status = (bySubjectAndDate[sub] && bySubjectAndDate[sub][d]) || "";
        if (status === "Present") present++;
        else if (status === "Leave") leave++;
        else absent++;
      });
    });
    const total = present + leave + absent;
    return {
      total,
      present,
      absent,
      leave,
      percentage: total > 0 ? ((present / total) * 100).toFixed(2) : 0,
    };
  }, [subjects, uniqueDates, bySubjectAndDate]);

  if (loading) {
    return <div className="loading">Loading attendance records...</div>;
  }

  return (
    <div className="attendance-record-container">
      <h2>My Attendance Record</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="attendance-record-header">
        {studentName && (
          <div className="attendance-student-label">
            <strong>Student:</strong> {studentName}
          </div>
        )}
        <div className="attendance-month-filter">
          <label htmlFor="attendance-month">Month</label>
          <input
            id="attendance-month"
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            className="attendance-month-input"
          />
        </div>
      </div>

      {recordsForMonth.length > 0 ? (
        <>
          <div className="attendance-table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th className="col-subject">Subject</th>
                  {uniqueDates.map((d) => (
                    <th key={d} className="col-date">
                      {d.slice(8)}
                      <span className="date-full">{d}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub}>
                    <td className="col-subject">{sub}</td>
                    {uniqueDates.map((d) => {
                      const status = bySubjectAndDate[sub][d];
                      const code = status === "Present" ? "P" : status === "Leave" ? "L" : "A";
                      const statusClass = status === "Present" ? "present" : status === "Leave" ? "leave" : "absent";
                      return (
                        <td key={d} className={`col-date status-${statusClass}`}>
                          <span className="status-code">{code}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="attendance-total-section">
            <h3>Total — {new Date(monthYear + "-01").toLocaleString("default", { month: "long", year: "numeric" })}</h3>
            <div className="attendance-summary">
              <>
                <div className="summary-card total">
                    <h4>Total Classes</h4>
                    <p className="summary-value">{summary.total}</p>
                  </div>
                  <div className="summary-card present">
                    <h4>Present</h4>
                    <p className="summary-value">{summary.present}</p>
                  </div>
                  <div className="summary-card absent">
                    <h4>Absent</h4>
                    <p className="summary-value">{summary.absent}</p>
                  </div>
                  <div className="summary-card leave">
                    <h4>Leave</h4>
                    <p className="summary-value">{summary.leave}</p>
                  </div>
                <div className="summary-card percentage">
                  <h4>Attendance %</h4>
                  <p className="summary-value">{summary.percentage}%</p>
                </div>
              </>
            </div>
          </div>
        </>
      ) : attendanceRecords.length > 0 ? (
        <div className="no-records">
          <p>No attendance records for {new Date(monthYear + "-01").toLocaleString("default", { month: "long", year: "numeric" })}.</p>
        </div>
      ) : (
        <div className="no-records">
          <p>No attendance records found.</p>
        </div>
      )}
    </div>
  );
}

export default AttendanceRecord;
