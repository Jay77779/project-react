import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "./ApplyLeave.css";

const API_BASE = "http://localhost:5000/api";
const COURSES = ["BBA", "BCA", "BCOM", "B.ED"];
const SEMESTERS = ["SEM-1", "SEM-2", "SEM-3", "SEM-4", "SEM-5", "SEM-6"];

function ApplyLeave() {
  const token = localStorage.getItem("token");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState("");
  const [allStudentsList, setAllStudentsList] = useState([]);
  const [allSubjectsList, setAllSubjectsList] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setLoadingOptions(false);
      return;
    }
    const fetchOptions = async () => {
      try {
        const [studentsRes, subjectsRes] = await Promise.all([
          axios.get(`${API_BASE}/students`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setAllStudentsList(Array.isArray(studentsRes.data) ? studentsRes.data : []);
        setAllSubjectsList(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      } catch {
        setAllStudentsList([]);
        setAllSubjectsList([]);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [token]);

  const courseOptions = useMemo(() => {
    const fromData = [...new Set(allStudentsList.map((s) => s.course).filter(Boolean))].sort();
    return fromData.length > 0 ? fromData : COURSES;
  }, [allStudentsList]);

  const semestersForCourse = useMemo(() => {
    if (!course) return [];
    const fromData = [
      ...new Set(
        allStudentsList.filter((s) => s.course === course).map((s) => s.semester).filter(Boolean)
      ),
    ].sort();
    return fromData.length > 0 ? fromData : SEMESTERS;
  }, [course, allStudentsList]);

  const subjectsForCourseSemester = useMemo(() => {
    if (!course || !semester) return [];
    const filtered = allSubjectsList.filter(
      (s) => (s.course || "") === course && (s.semester || "") === semester
    );
    const names = [...new Set(filtered.map((s) => s.name).filter(Boolean))].sort();
    return names;
  }, [course, semester, allSubjectsList]);

  const studentsForCourseSemester = useMemo(() => {
    if (!course || !semester) return [];
    return allStudentsList
      .filter((s) => s.course === course && s.semester === semester)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [course, semester, allStudentsList]);

  const onCourseChange = (value) => {
    setCourse(value);
    setSemester("");
    setSubject("");
    setStudentId("");
  };

  const onSemesterChange = (value) => {
    setSemester(value);
    setSubject("");
    setStudentId("");
  };

  const onSubjectChange = (value) => {
    setSubject(value);
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!studentId || !date || !subject || !token) {
      setMessage("Please select course, semester, subject, student and date.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      await axios.post(
        `${API_BASE}/attendance/mark`,
        {
          studentId,
          date,
          subject,
          status: "Leave",
          remarks: "Leave applied",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Leave applied successfully.");
      setDate("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to apply leave. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="apply-leave-container">
      <h2>Apply Leave (Student)</h2>
      <p className="apply-leave-desc">Select course, semester, student, date and mark as Leave.</p>

      {message && (
        <div className={`apply-leave-message ${message.includes("success") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleApplyLeave} className="apply-leave-form">
        <div className="apply-leave-filters">
          <div className="apply-leave-group">
            <label htmlFor="leave-course">Course</label>
            <select
              id="leave-course"
              value={course}
              onChange={(e) => onCourseChange(e.target.value)}
              className="apply-leave-select"
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? "Loading…" : "Select course"}</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="apply-leave-group">
            <label htmlFor="leave-semester">Semester</label>
            <select
              id="leave-semester"
              value={semester}
              onChange={(e) => onSemesterChange(e.target.value)}
              className="apply-leave-select"
              disabled={!course}
            >
              <option value="">{!course ? "Select course first" : "Select semester"}</option>
              {semestersForCourse.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="apply-leave-group">
            <label htmlFor="leave-subject">Subject</label>
            <select
              id="leave-subject"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="apply-leave-select"
              disabled={!semester}
            >
              <option value="">{!semester ? "Select semester first" : "Select subject"}</option>
              {subjectsForCourseSemester.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="apply-leave-group">
            <label htmlFor="leave-student">Student name</label>
            <select
              id="leave-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="apply-leave-select"
              disabled={!semester}
            >
              <option value="">{!semester ? "Select semester first" : "Select student"}</option>
              {studentsForCourseSemester.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="apply-leave-group">
            <label htmlFor="leave-date">Date</label>
            <input
              id="leave-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="apply-leave-input"
              required
            />
          </div>

          <div className="apply-leave-group apply-leave-actions">
            <button type="submit" className="apply-leave-btn" disabled={submitting || !studentId || !date || !subject}>
              {submitting ? "Applying…" : "Apply Leave"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ApplyLeave;
