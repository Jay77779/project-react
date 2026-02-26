import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./ManageMarks.css";

const API_BASE = "http://localhost:5000/api";
const COURSES = ["BBA", "BCA", "BCOM", "B.ED"];
const SEMESTERS = ["SEM-1", "SEM-2", "SEM-3", "SEM-4", "SEM-5", "SEM-6"];
const DEFAULT_EXAM_TYPES = ["Mid Term", "Final", "Internal", "External", "Unit Test", "Practical"];

function getStudentId(s) {
  if (!s) return null;
  const raw = s._id ?? s.id;
  if (raw == null) return null;
  return typeof raw === "string" ? raw : String(raw);
}

function ManageMarks() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentWithExams, setStudentWithExams] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [marksBySubject, setMarksBySubject] = useState({});
  const [examName, setExamName] = useState("");
  const [examNameIsOther, setExamNameIsOther] = useState(false);
  const [perSubjectTotalMarks, setPerSubjectTotalMarks] = useState(100);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search box: filter by course, semester, student and view marks
  const [searchCourse, setSearchCourse] = useState("");
  const [searchSemester, setSearchSemester] = useState("");
  const [searchStudentId, setSearchStudentId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pendingExamToLoad, setPendingExamToLoad] = useState(null);
  const [deletingExamName, setDeletingExamName] = useState(null);

  const token = localStorage.getItem("token");

  const filteredStudentsForSearch = students.filter(
    (s) =>
      (!searchCourse || s.course === searchCourse) &&
      (!searchSemester || s.semester === searchSemester)
  );

  useEffect(() => {
    if (!searchStudentId) {
      setSearchResult(null);
      return;
    }
    const fetchStudentMarks = async () => {
      try {
        setLoadingSearch(true);
        const res = await axios.get(`${API_BASE}/students/${searchStudentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSearchResult(res.data);
      } catch (err) {
        setSearchResult(null);
      } finally {
        setLoadingSearch(false);
      }
    };
    fetchStudentMarks();
  }, [searchStudentId, token]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const res = await axios.get(`${API_BASE}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load students");
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [token]);

  useEffect(() => {
    if (!selectedStudentId) {
      setSubjects([]);
      setMarksBySubject({});
      setStudentWithExams(null);
      setError("");
      setPendingExamToLoad(null);
      return;
    }
    const fetchStudent = async () => {
      try {
        const studentRes = await axios.get(`${API_BASE}/students/${selectedStudentId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null }));
        setStudentWithExams(studentRes.data && Array.isArray(studentRes.data.exams) && studentRes.data.exams.length > 0 ? studentRes.data : null);
      } catch {
        setStudentWithExams(null);
      }
    };
    fetchStudent();
  }, [selectedStudentId, token]);

  // Fetch subjects by student's course and semester only (no exam name filter)
  useEffect(() => {
    if (!selectedStudentId) {
      setSubjects([]);
      setMarksBySubject({});
      return;
    }
    const fetchSubjectsByStudent = async () => {
      try {
        setLoadingSubjects(true);
        setError("");
        const subjRes = await axios.get(
          `${API_BASE}/subjects/by-student/${selectedStudentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = subjRes.data || [];
        setSubjects(list);
        setMarksBySubject((prev) => {
          const next = {};
          list.forEach((s) => { next[s.name] = prev[s.name] ?? ""; });
          return next;
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load subjects for this student.");
        setSubjects([]);
        setMarksBySubject({});
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjectsByStudent();
  }, [selectedStudentId, token]);

  const loadExistingExam = useCallback((exam) => {
    if (!exam) return;
    setExamName(exam.examName || "Mid Term");
    setExamNameIsOther(false);
    setPerSubjectTotalMarks(Number(exam.perSubjectTotalMarks) || 100);
    const bySub = {};
    (exam.subjects || []).forEach((s) => {
      bySub[s.name] = s.obtainedMarks != null && s.obtainedMarks !== "" ? String(s.obtainedMarks) : "";
    });
    subjects.forEach((s) => { if (bySub[s.name] === undefined) bySub[s.name] = ""; });
    setMarksBySubject(bySub);
    setSuccess("Loaded existing exam. You can edit and save.");
  }, [subjects]);

  // When we came from "Edit" in search card: after subjects load, load the pending exam
  useEffect(() => {
    if (!pendingExamToLoad || subjects.length === 0) return;
    loadExistingExam(pendingExamToLoad);
    setPendingExamToLoad(null);
  }, [pendingExamToLoad, subjects, loadExistingExam]);

  const handleMarkChange = (subjectName, value) => {
    setMarksBySubject((prev) => ({ ...prev, [subjectName]: value }));
    setSuccess("");
    setError("");
  };

  const handleEditExamFromSearch = (exam) => {
    if (!searchResult) return;
    const id = getStudentId(searchResult);
    if (!id) return;
    setSelectedStudentId(id);
    setPendingExamToLoad(exam);
    setSuccess("Loading exam for editing in the form above.");
  };

  const handleDeleteExamFromSearch = async (studentId, examName) => {
    try {
      setDeletingExamName(examName);
      setError("");
      await axios.delete(`${API_BASE}/students/${studentId}/marks`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { examName },
      });
      setSuccess(`Exam "${examName}" deleted.`);
      const res = await axios.get(`${API_BASE}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete exam.");
    } finally {
      setDeletingExamName(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedStudentId) {
      setError("Please select a student first.");
      return;
    }
    const subjectList = subjects.map((s) => ({
      name: s.name,
      totalMarks: s.totalMarks ?? perSubjectTotalMarks,
      obtainedMarks: marksBySubject[s.name] === "" ? null : Number(marksBySubject[s.name]),
    }));
    const filled = subjectList.filter((s) => s.obtainedMarks != null && !Number.isNaN(s.obtainedMarks));
    if (filled.length === 0) {
      setError("Enter at least one subject mark.");
      return;
    }
    try {
      setSubmitting(true);
      await axios.put(
        `${API_BASE}/students/${selectedStudentId}/marks`,
        {
          examName: examName.trim() || "Mid Term",
          perSubjectTotalMarks: Number(perSubjectTotalMarks) || 100,
          subjects: subjectList,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Marks saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save marks.");
    } finally {
      setSubmitting(false);
    }
  };

  const examNameOptions = [
    ...new Set([
      ...DEFAULT_EXAM_TYPES,
      ...(studentWithExams?.exams?.map((e) => e.examName).filter(Boolean) || []),
      ...(searchResult?.exams?.map((e) => e.examName).filter(Boolean) || []),
    ]),
  ].sort();

  return (
    <div className="manage-marks">
      <div className="manage-marks-card">
        <h2>Manage Marks & Exam</h2>
        <p className="manage-marks-desc">
          Select a student to load subjects by their course and semester. Enter marks and submit.
        </p>
        <div className="form-group">
          <label htmlFor="student-select">Select Student</label>
          <select
            id="student-select"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={loadingStudents}
          >
            <option value="">-- Choose student --</option>
            {students.map((s) => (
              <option key={getStudentId(s) || s.email} value={getStudentId(s)}>
                {s.name} ({s.course}, {s.semester})
              </option>
            ))}
          </select>
        </div>
        {!selectedStudentId && (
          <p className="manage-marks-hint">Select a student to see subjects and enter marks.</p>
        )}
        {selectedStudentId && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="exam-name">Exam Name</label>
                <select
                  id="exam-name"
                  value={examNameIsOther || (examName && !examNameOptions.includes(examName)) ? "__other__" : (examNameOptions.includes(examName) ? examName : "")}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__other__") {
                      setExamNameIsOther(true);
                    } else {
                      setExamNameIsOther(false);
                      setExamName(v);
                    }
                  }}
                >
                  <option value="">Select exam</option>
                  {examNameOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="__other__">Other (type below)</option>
                </select>
                {(examNameIsOther || (!examNameOptions.includes(examName) && examName)) && (
                  <input
                    type="text"
                    className="manage-marks-exam-other"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. Mid Term, Final"
                  />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="per-total">Total Marks per Subject</label>
                <input
                  id="per-total"
                  type="number"
                  min={1}
                  value={perSubjectTotalMarks}
                  onChange={(e) => setPerSubjectTotalMarks(e.target.value)}
                />
              </div>
            </div>
          </>
        )}
        {selectedStudentId && loadingSubjects && (
          <p className="manage-marks-loading">Loading subjects…</p>
        )}
        {selectedStudentId && !loadingSubjects && subjects.length === 0 && !error && (
          <p className="manage-marks-no-subjects">No subjects for this student's course and semester. Add subjects in the Subject page for this course and semester.</p>
        )}
        {selectedStudentId && !loadingSubjects && subjects.length > 0 && (
          <>
            <form onSubmit={handleSubmit}>
              <div className="subjects-marks-list">
                <div className="subjects-marks-header">
                  <span>Subject</span>
                  <span>Obtained Marks <span className="marks-max-hint">(max {perSubjectTotalMarks})</span></span>
                </div>
                {subjects.map((sub) => {
                  const maxMarks = sub.totalMarks ?? perSubjectTotalMarks;
                  return (
                    <div key={sub.name} className="subject-marks-row">
                      <span className="subject-name">{sub.name}</span>
                      <div className="subject-marks-input-wrap">
                        <div className="marks-input-box">
                          <input
                            type="number"
                            min={0}
                            max={maxMarks}
                            value={marksBySubject[sub.name] ?? ""}
                            onChange={(e) => handleMarkChange(sub.name, e.target.value)}
                            placeholder="0"
                            aria-label={`Marks obtained in ${sub.name} (0 to ${maxMarks})`}
                          />
                          <span className="marks-input-suffix">/ {maxMarks}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {error && <p className="manage-marks-error">{error}</p>}
              {success && <p className="manage-marks-success">{success}</p>}
              <button type="submit" className="submit-marks-btn" disabled={submitting}>
                {submitting ? "Saving…" : "Save Marks"}
              </button>
            </form>
          </>
        )}
        {error && !selectedStudentId && <p className="manage-marks-error">{error}</p>}
      </div>

      <div className="manage-marks-card search-marks-card">
        <h2>Search / View marks by filters</h2>
        <p className="manage-marks-desc">
          Filter by course and semester, then select a student to view their exam marks.
        </p>
        <div className="search-marks-filters">
          <div className="form-group">
            <label htmlFor="search-course">Course</label>
            <select
              id="search-course"
              value={searchCourse}
              onChange={(e) => {
                setSearchCourse(e.target.value);
                setSearchStudentId("");
                setSearchResult(null);
              }}
            >
              <option value="">All courses</option>
              {COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="search-semester">Semester</label>
            <select
              id="search-semester"
              value={searchSemester}
              onChange={(e) => {
                setSearchSemester(e.target.value);
                setSearchStudentId("");
                setSearchResult(null);
              }}
            >
              <option value="">All semesters</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="search-student">Student</label>
            <select
              id="search-student"
              value={searchStudentId}
              onChange={(e) => setSearchStudentId(e.target.value)}
              disabled={loadingStudents}
            >
              <option value="">-- Choose student --</option>
              {filteredStudentsForSearch.map((s) => (
                <option key={getStudentId(s) || s.email} value={getStudentId(s)}>
                  {s.name} ({s.course}, {s.semester})
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredStudentsForSearch.length === 0 && students.length > 0 && (
          <p className="manage-marks-hint">No students match the selected course and semester.</p>
        )}
        {searchStudentId && loadingSearch && (
          <p className="manage-marks-loading">Loading marks…</p>
        )}
        {searchStudentId && !loadingSearch && searchResult && (
          <div className="search-marks-result">
            <p className="manage-marks-student-info">
              <strong>{searchResult.name}</strong> â€” {searchResult.course}, {searchResult.semester}
            </p>
            {!searchResult.exams || searchResult.exams.length === 0 ? (
              <p className="manage-marks-hint">No exam marks recorded yet.</p>
            ) : (
              <div className="search-marks-table-wrap">
                {searchResult.exams.map((exam, idx) => (
                  <div key={exam.examName || idx} className="search-exam-block">
                    <div className="search-exam-header">
                      <h4 className="search-exam-title">{exam.examName || `Exam ${idx + 1}`}</h4>
                      <div className="search-exam-actions">
                        <button
                          type="button"
                          className="btn-edit-exam"
                          onClick={() => handleEditExamFromSearch(exam)}
                          title="Edit this exam"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-delete-exam"
                          onClick={() => handleDeleteExamFromSearch(getStudentId(searchResult), exam.examName)}
                          disabled={deletingExamName === exam.examName}
                          title="Delete this exam"
                        >
                          {deletingExamName === exam.examName ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                    <table className="search-marks-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Obtained</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(exam.subjects || []).map((sub) => (
                          <tr key={sub.name}>
                            <td>{sub.name}</td>
                            <td>{sub.obtainedMarks != null ? sub.obtainedMarks : "â€”"}</td>
                            <td>{sub.totalMarks != null ? sub.totalMarks : "â€”"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageMarks;
