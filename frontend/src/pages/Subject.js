import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBook, FaEdit, FaTrash } from "react-icons/fa";
import AddSubject from "../components/AddSubject";
import "./Subject.css";

const API_BASE = "http://localhost:5000/api";
const COURSES = ["BBA", "BCA", "BCOM", "B.ED"];
const SEMESTERS = ["SEM-1", "SEM-2", "SEM-3", "SEM-4", "SEM-5", "SEM-6"];
function Subject() {
  const userRole = localStorage.getItem("role");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [editSubject, setEditSubject] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [tableError, setTableError] = useState("");
  const token = localStorage.getItem("token");

  // Cascading: Semester depends on Course
  const semestersForCourse = selectedCourse
    ? (() => {
        const list = [...new Set(subjects.filter((s) => s.course === selectedCourse).map((s) => s.semester))].sort();
        return list.length ? list : SEMESTERS;
      })()
    : [];

  const onCourseChange = (value) => {
    setSelectedCourse(value);
    setSelectedSemester("");
  };
  const onSemesterChange = (value) => {
    setSelectedSemester(value);
  };

  const fetchSubjects = () => {
    axios.get(`${API_BASE}/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setSubjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSubjects([]));
  };

  useEffect(() => {
    if (userRole !== "teacher" || !token) {
      setLoading(false);
      return;
    }
    axios
      .get(`${API_BASE}/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setSubjects(Array.isArray(res.data) ? res.data : []))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }, [userRole, token]);

  // Filter subjects by selected course and semester
  const filteredSubjects = subjects.filter(
    (s) =>
      (!selectedCourse || s.course === selectedCourse) &&
      (!selectedSemester || s.semester === selectedSemester)
  );

  const getSubjectId = (subject) => {
    if (!subject) return null;
    const raw = subject._id ?? subject.id;
    if (raw == null) return null;
    if (typeof raw === "string") return raw;
    if (typeof raw === "object" && raw.$oid) return raw.$oid;
    if (typeof raw.toString === "function") return raw.toString();
    return String(raw);
  };

  const handleDeleteOne = (subject) => {
    if (!subject) return;
    const id = getSubjectId(subject);
    if (!id) {
      setTableError("Cannot delete: subject id missing. Refresh the page.");
      return;
    }
    if (!window.confirm(`Delete subject "${subject.name}"?`)) return;
    setTableError("");
    axios
      .delete(`${API_BASE}/subjects/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchSubjects())
      .catch((err) => setTableError(err.response?.data?.message || "Delete failed."));
  };

  const openEditOne = (e, subject) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!subject) return;
    const id = getSubjectId(subject);
    if (!id) {
      setTableError("Cannot edit: subject id missing. Refresh the page.");
      return;
    }
    setTableError("");
    setEditSubject(subject);
    setEditName(subject.name || "");
  };

  const handleEditSaveOne = async () => {
    if (!editSubject) return;
    const id = getSubjectId(editSubject);
    if (!id) {
      setTableError("Cannot save: subject id missing.");
      return;
    }
    const name = (editName || "").trim();
    if (!name) {
      setTableError("Enter a subject name.");
      return;
    }
    setSaving(true);
    setTableError("");
    try {
      await axios.put(
        `${API_BASE}/subjects/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditSubject(null);
      fetchSubjects();
    } catch (err) {
      setTableError(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="subject-page">
      <div className="subject-header">
        <h1><FaBook /> Subject</h1>
        <p>
          {userRole === "teacher"
            ? "Add subjects by course and semester. View them in the table below."
            : "View your subjects and performance"}
        </p>
      </div>
      <div className="subject-content">
        {userRole === "teacher" ? (
          <>
            <div className="subject-section">
              <div className="section-title"><h2>Add Subjects</h2></div>
              <AddSubject onAdded={fetchSubjects} />
            </div>
            <div className="subject-section">
              <div className="section-title"><h2>Course-wise subjects</h2></div>
              <div className="subject-table-card">
                {loading ? (
                  <p className="subject-table-loading">Loading…</p>
                ) : (
                  <>
                    <p className="subject-filters-hint">Select in order: Course → Semester (subjects depend on these).</p>
                    <div className="subject-filters">
                      <div className="subject-filter-group">
                        <label htmlFor="subject-course">Course</label>
                        <select
                          id="subject-course"
                          value={selectedCourse}
                          onChange={(e) => onCourseChange(e.target.value)}
                          className="subject-select"
                        >
                          <option value="">All courses</option>
                          {COURSES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="subject-filter-group">
                        <label htmlFor="subject-semester">Semester</label>
                        <select
                          id="subject-semester"
                          value={selectedSemester}
                          onChange={(e) => onSemesterChange(e.target.value)}
                          className="subject-select"
                          disabled={!selectedCourse}
                        >
                          <option value="">{selectedCourse ? "All semesters" : "Select course first"}</option>
                          {semestersForCourse.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {tableError && <p className="subject-table-error">{tableError}</p>}
                    {filteredSubjects.length === 0 ? (
                      <p className="subject-table-empty">
                        {subjects.length === 0
                          ? "No subjects added yet. Add subjects above."
                          : "No subjects for the selected course and semester."}
                      </p>
                    ) : (
                      <table className="subject-table">
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Semester</th>
                            <th>Subject</th>
                            <th className="subject-table-actions">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSubjects.map((s, idx) => (
                            <tr key={getSubjectId(s) || `row-${idx}`}>
                              <td>{s.course}</td>
                              <td>{s.semester}</td>
                              <td>{s.name}</td>
                              <td className="subject-table-actions">
                                <button type="button" className="subject-btn subject-btn-edit" onClick={(e) => openEditOne(e, s)} title="Edit" aria-label="Edit subject">
                                  <FaEdit />
                                </button>
                                <button type="button" className="subject-btn subject-btn-delete" onClick={() => handleDeleteOne(s)} title="Delete" aria-label="Delete subject">
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </div>
            </div>

            {editSubject && (
              <div className="subject-edit-overlay">
                <div className="subject-edit-modal">
                  <h3>Edit subject — {editSubject.course} {editSubject.semester}</h3>
                  <p className="subject-edit-hint">Change the subject name.</p>
                  <div className="subject-edit-field">
                    <label htmlFor="edit-subject-name">Subject name</label>
                    <input
                      id="edit-subject-name"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="subject-edit-input"
                      placeholder="Subject name"
                    />
                  </div>
                  <div className="subject-edit-buttons">
                    <button type="button" className="subject-btn-cancel" onClick={() => { setEditSubject(null); setTableError(""); }}>Cancel</button>
                    <button type="button" className="subject-btn-save" onClick={handleEditSaveOne} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="subject-placeholder">
            <FaBook className="subject-icon" />
            <p>Subject and marks are available in Result and Profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subject;
