import React, { useState } from "react";
import axios from "axios";
import { FaPlus, FaMinus } from "react-icons/fa";
import "./AddSubject.css";

const API_BASE = "http://localhost:5000/api";

const COURSES = ["BBA", "BCA", "BCOM", "B.ED"];
const SEMESTERS = ["SEM-1", "SEM-2", "SEM-3", "SEM-4", "SEM-5", "SEM-6"];

function AddSubject({ onAdded }) {
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subjectRows, setSubjectRows] = useState([{ name: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const onCourseChange = (value) => {
    setCourse(value);
    setSemester("");
  };
  const onSemesterChange = (value) => setSemester(value);

  const addRow = () => {
    setSubjectRows((prev) => [...prev, { name: "" }]);
    setSuccess("");
    setError("");
  };

  const removeRow = (index) => {
    if (subjectRows.length <= 1) return;
    setSubjectRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index, value) => {
    setSubjectRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, name: value } : row))
    );
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!course || !semester) {
      setError("Select course and semester.");
      return;
    }
    const subjects = subjectRows
      .map((r) => ({ name: String(r.name).trim() }))
      .filter((s) => s.name);
    if (subjects.length === 0) {
      setError("Add at least one subject name.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/subjects`,
        { course, semester, examName: "General", subjects },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Added ${subjects.length} subject(s) for ${course} ${semester}.`);
      setSubjectRows([{ name: "" }]);
      if (typeof onAdded === "function") onAdded();
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the backend. Start it in a separate terminal: cd student-backend && node server.js (MongoDB must be running).");
        return;
      }
      const msg = err.response?.data?.message || err.response?.data?.error;
      setError(msg || (err.response?.status === 401 ? "Please log in again." : err.response?.status === 403 ? "Access denied." : `Failed to add subjects (${err.response?.status || "error"}).`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-subject">
      <div className="add-subject-card">
        <h2>Add Subjects</h2>
        <p className="add-subject-desc">
          Add in order: <strong>Course → Semester → Subject names</strong>. Data is saved in MongoDB and used when entering marks.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="add-subject-filters">
            <div className="form-group">
              <label>Course</label>
              <select value={course} onChange={(e) => onCourseChange(e.target.value)} required>
                <option value="">Select course</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Semester</label>
              <select value={semester} onChange={(e) => onSemesterChange(e.target.value)} required disabled={!course}>
                <option value="">{course ? "Select semester" : "Select course first"}</option>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="subject-rows-header">
            <span>Subject name</span>
            <span className="action-col"></span>
          </div>
          {subjectRows.map((row, index) => (
            <div key={index} className="subject-row">
              <input
                type="text"
                placeholder="e.g. Mathematics"
                value={row.name}
                onChange={(e) => updateRow(index, e.target.value)}
              />
              <button type="button" className="remove-row-btn" onClick={() => removeRow(index)} title="Remove row">
                <FaMinus />
              </button>
            </div>
          ))}
          <button type="button" className="add-row-btn" onClick={addRow}>
            <FaPlus /> Add another subject
          </button>
          {error && <p className="add-subject-error">{error}</p>}
          {success && <p className="add-subject-success">{success}</p>}
          <button type="submit" className="submit-subject-btn" disabled={loading}>
            {loading ? "Adding…" : "Add Subjects"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddSubject;
