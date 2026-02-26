import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./AttendanceGrid.css";

const API_BASE = "http://localhost:5000/api";
const COURSES = ["BBA", "BCA", "BCOM", "B.ED"];
const SEMESTERS = ["SEM-1", "SEM-2", "SEM-3", "SEM-4", "SEM-5", "SEM-6"];

function getDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year, month) {
  const last = new Date(year, month, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month - 1, d));
  }
  return days;
}

function AttendanceGrid() {
  const token = localStorage.getItem("token");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [allStudentsList, setAllStudentsList] = useState([]);
  const [allSubjectsList, setAllSubjectsList] = useState([]);
  const [students, setStudents] = useState([]);
  const [gridMap, setGridMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState({});

  const [y, m] = monthYear.split("-").map(Number);
  const dayDates = getDaysInMonth(y, m);
  const numDays = dayDates.length;

  // Fetch students and subjects once to derive course, semester, subject options
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

  const courseOptions = React.useMemo(() => {
    const fromData = [...new Set(allStudentsList.map((s) => s.course).filter(Boolean))].sort();
    return fromData.length > 0 ? fromData : COURSES;
  }, [allStudentsList]);

  const semestersForCourse = React.useMemo(() => {
    if (!course) return [];
    const fromData = [
      ...new Set(
        allStudentsList.filter((s) => s.course === course).map((s) => s.semester).filter(Boolean)
      ),
    ].sort();
    return fromData.length > 0 ? fromData : SEMESTERS;
  }, [course, allStudentsList]);

  const subjectsForCourseSemester = React.useMemo(() => {
    if (!course || !semester) return [];
    const filtered = allSubjectsList.filter(
      (s) => (s.course || "") === course && (s.semester || "") === semester
    );
    const names = [...new Set(filtered.map((s) => s.name).filter(Boolean))].sort();
    return names;
  }, [course, semester, allSubjectsList]);

  const onCourseChange = (value) => {
    setCourse(value);
    setSemester("");
    setSubject("");
  };

  const onSemesterChange = (value) => {
    setSemester(value);
    setSubject("");
  };

  const fetchGrid = useCallback(async () => {
    if (!course || !semester || !subject || !token) return;
    const [yr, mo] = monthYear.split("-").map(Number);
    const days = getDaysInMonth(yr, mo);
    if (days.length === 0) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.get(`${API_BASE}/attendance/grid`, {
        params: {
          startDate: getDateStr(days[0]),
          endDate: getDateStr(days[days.length - 1]),
          subject,
          course,
          semester,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data.students || []);
      const map = {};
      (res.data.grid || []).forEach((r) => {
        const key = `${r.studentId}|${r.date}`;
        map[key] = r.status;
      });
      setGridMap(map);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load attendance.");
      setStudents([]);
      setGridMap({});
    } finally {
      setLoading(false);
    }
  }, [course, semester, subject, monthYear, token]);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  const getStatus = (studentId, dateStr) => {
    const key = `${studentId}|${dateStr}`;
    return gridMap[key] || null;
  };

  const setStatus = (studentId, dateStr, status) => {
    const key = `${studentId}|${dateStr}`;
    setGridMap((prev) => ({ ...prev, [key]: status }));
  };

  const handleToggle = async (studentId, dateStr, currentStatus) => {
    const nextStatus = currentStatus === "Present" ? "Absent" : "Present";
    setStatus(studentId, dateStr, nextStatus);
    const cellKey = `${studentId}|${dateStr}`;
    setSaving((prev) => ({ ...prev, [cellKey]: true }));
    setMessage("");
    try {
      await axios.post(
        `${API_BASE}/attendance/mark`,
        {
          studentId,
          date: dateStr,
          subject,
          status: nextStatus,
          remarks: "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      setStatus(studentId, dateStr, currentStatus);
      setMessage(err.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setSaving((prev) => ({ ...prev, [cellKey]: false }));
    }
  };

  const hasFilters = course && semester && subject;

  return (
    <div className="attendance-grid-container">
      <div className="attendance-grid-header">
        <div className="grid-filters">
          <div className="grid-filter-group">
            <label htmlFor="grid-course">Course name</label>
            <select
              id="grid-course"
              value={course}
              onChange={(e) => onCourseChange(e.target.value)}
              className="grid-select"
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? "Loading…" : "Select course"}</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid-filter-group">
            <label htmlFor="grid-semester">Semester</label>
            <select
              id="grid-semester"
              value={semester}
              onChange={(e) => onSemesterChange(e.target.value)}
              className="grid-select"
              disabled={!course}
            >
              <option value="">{!course ? "Select course first" : "Select semester"}</option>
              {semestersForCourse.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid-filter-group">
            <label htmlFor="grid-subject">Subject</label>
            <select
              id="grid-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="grid-select"
              disabled={!semester}
            >
              <option value="">{!semester ? "Select semester first" : "Select subject"}</option>
              {subjectsForCourseSemester.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="grid-filter-group">
            <label htmlFor="grid-month">Month</label>
            <input
              id="grid-month"
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="grid-input"
            />
          </div>
        </div>
      </div>

      {message && <div className="attendance-grid-message">{message}</div>}

      {!hasFilters && (
        <p className="attendance-grid-hint">Select course, semester and subject to load the attendance table.</p>
      )}

      {hasFilters && loading && (
        <p className="attendance-grid-loading">Loading…</p>
      )}

      {hasFilters && !loading && (
        <div className="attendance-grid-wrap">
          <p className="attendance-sheet-title">Monthly Attendance Sheet — {new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" })}</p>
          <div className="attendance-grid-scroll">
            <div className="attendance-grid-scroll-inner">
            <table className="attendance-grid-table">
              <thead>
                <tr>
                  <th className="col-student">Student name</th>
                  {dayDates.map((d, i) => (
                    <th key={i} className="col-day">
                      {d.getDate()}
                      <span className="day-date">{getDateStr(d).slice(5)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={numDays + 1} className="no-students">No students for this course and semester.</td>
                  </tr>
                ) : (
                students.map((student) => {
                  const sid = String(student._id);
                  return (
                  <tr key={sid}>
                    <td className="col-student name">{student.name}</td>
                    {dayDates.map((d, i) => {
                      const dateStr = getDateStr(d);
                      const status = getStatus(sid, dateStr);
                      const isPresent = status === "Present";
                      const cellKey = `${sid}|${dateStr}`;
                      const isSaving = saving[cellKey];
                      return (
                        <td key={i} className="col-day">
                          <label className="attendance-cell">
                            <input
                              type="checkbox"
                              checked={isPresent}
                              disabled={isSaving}
                              onChange={() => handleToggle(sid, dateStr, status)}
                              title={isPresent ? "Present (click for Absent)" : "Absent (click for Present)"}
                            />
                            <span className="checkmark">{isPresent ? "✓" : ""}</span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
                })
              )}
              </tbody>
            </table>
            </div>
          </div>
          <div className="attendance-grid-legend">
            <span className="legend-item"><span className="box present">✓</span> Present</span>
            <span className="legend-item"><span className="box absent"></span> Absent</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceGrid;
