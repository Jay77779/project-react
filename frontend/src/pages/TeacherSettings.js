import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./StudentSettings.css";

const API_BASE = "http://localhost:5000/api";

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString();
}

function getMonthRange(offsetMonths = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offsetMonths; // 0-based
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const from = `${first.getFullYear()}-${pad(first.getMonth() + 1)}-${pad(first.getDate())}`;
  const to = `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`;
  return { from, to };
}

export default function TeacherSettings() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterPreset, setFilterPreset] = useState("thisMonth");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const token = localStorage.getItem("token");

  const { effectiveFrom, effectiveTo } = useMemo(() => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    if (filterPreset === "today") {
      return { effectiveFrom: todayStr, effectiveTo: todayStr };
    }
    if (filterPreset === "thisMonth") {
      const { from, to } = getMonthRange(0);
      return { effectiveFrom: from, effectiveTo: to };
    }
    if (filterPreset === "lastMonth") {
      const { from, to } = getMonthRange(-1);
      return { effectiveFrom: from, effectiveTo: to };
    }
    // custom or all
    return {
      effectiveFrom: fromDate || "",
      effectiveTo: toDate || "",
    };
  }, [filterPreset, fromDate, toDate]);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (effectiveFrom) params.from = effectiveFrom;
      if (effectiveTo) params.to = effectiveTo;

      const res = await axios.get(`${API_BASE}/students/password-changes`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load password change activity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPreset, effectiveFrom, effectiveTo]);

  const uniqueStudentsCount = useMemo(() => {
    const setIds = new Set();
    logs.forEach((l) => {
      if (l.studentId) setIds.add(l.studentId);
    });
    return setIds.size;
  }, [logs]);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Security & Password Activity</h1>
        <p className="subtitle">
          View which students have changed their passwords and when.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="settings-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-info">
              <h2>Password Change Activity</h2>
              <p>
                Showing{" "}
                <strong>{logs.length}</strong> change
                {logs.length === 1 ? "" : "s"} for{" "}
                <strong>{uniqueStudentsCount}</strong> student
                {uniqueStudentsCount === 1 ? "" : "s"}.
              </p>
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-item">
              <label>Quick filter</label>
              <select
                value={filterPreset}
                onChange={(e) => setFilterPreset(e.target.value)}
              >
                <option value="thisMonth">This month</option>
                <option value="lastMonth">Last month</option>
                <option value="today">Today</option>
                <option value="custom">Custom range</option>
                <option value="all">All time</option>
              </select>
            </div>

            {(filterPreset === "custom" || filterPreset === "all") && (
              <>
                <div className="profile-item">
                  <label>From date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="profile-item">
                  <label>To date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner" style={{ marginTop: 20 }}>
              Loading activity...
            </div>
          ) : logs.length === 0 ? (
            <p style={{ marginTop: 20 }}>No password changes found for this period.</p>
          ) : (
            <div className="fees-table" style={{ marginTop: 20 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date & time</th>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Division</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.changedAt)}</td>
                      <td>{log.name || "-"}</td>
                      <td>{log.email || "-"}</td>
                      <td>{log.course || "-"}</td>
                      <td>{log.semester || "-"}</td>
                      <td>{log.division || "-"}</td>
                      <td>{log.method === "student-otp" ? "Student (OTP)" : log.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

