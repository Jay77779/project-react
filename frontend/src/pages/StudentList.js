import React, { useState, useEffect, useCallback } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import "./StudentList.css";

function StudentList() {
  const [search, setSearch] = useState("");
  const [compact, setCompact] = useState(false);
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableDivisions, setAvailableDivisions] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    course: "",
    password: "",
    phone: "",
    address: "",
    semester: "",
    division: "",
    exams: [],
  });

  const token = localStorage.getItem("token");

  // Fetch all students
  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Derive filter options when students change
  useEffect(() => {
    const courses = Array.from(new Set(students.map((s) => s.course).filter(Boolean)));
    setAvailableCourses(courses);

    if (selectedCourse) {
      const divisions = Array.from(
        new Set(
          students
            .filter((s) => s.course === selectedCourse)
            .map((s) => s.division)
            .filter(Boolean)
        )
      );
      setAvailableDivisions(divisions);
      if (!divisions.includes(selectedDivision)) {
        setSelectedDivision("");
      }
    } else {
      setAvailableDivisions([]);
      setSelectedDivision("");
    }

    // Collect unique exam names for exam filter
    const examNamesSet = new Set();
    students.forEach((s) => {
      (Array.isArray(s.exams) ? s.exams : []).forEach((exam) => {
        if (exam.examName) {
          examNamesSet.add(exam.examName);
        }
      });
    });
    setAvailableExams(Array.from(examNamesSet));
  }, [students, selectedCourse, selectedDivision]);

  const filteredStudents = students.filter((s) => {
    const courseMatch = selectedCourse ? s.course === selectedCourse : true;
    const divisionMatch = selectedDivision ? s.division === selectedDivision : true;
    const searchTerm = search.trim().toLowerCase();
    const searchMatch = !searchTerm || (s.name && s.name.toLowerCase().includes(searchTerm)) || (s.email && s.email.toLowerCase().includes(searchTerm)) || (s.course && s.course.toLowerCase().includes(searchTerm));
    return courseMatch && divisionMatch && searchMatch;
  });
  const totalCount = students.length;
  const filteredCount = filteredStudents.length;

  const recalculateExams = (exams) => {
    if (!Array.isArray(exams)) return [];
    return exams.map((exam) => {
      const subjects = Array.isArray(exam.subjects) ? exam.subjects.map((subj) => {
        const totalMarks =
          typeof subj.totalMarks === "number"
            ? subj.totalMarks
            : typeof exam.perSubjectTotalMarks === "number"
            ? exam.perSubjectTotalMarks
            : parseInt(subj.totalMarks || exam.perSubjectTotalMarks || 0, 10) || 0;
        const obtainedMarks = parseInt(subj.obtainedMarks || 0, 10) || 0;
        return {
          ...subj,
          totalMarks,
          obtainedMarks,
        };
      }) : [];

      let totalMarksSum = 0;
      let obtainedMarksSum = 0;
      subjects.forEach((s) => {
        totalMarksSum += s.totalMarks || 0;
        obtainedMarksSum += s.obtainedMarks || 0;
      });
      const percentage = totalMarksSum
        ? parseFloat(((obtainedMarksSum / totalMarksSum) * 100).toFixed(2))
        : 0;

      return {
        ...exam,
        subjects,
        totalMarks: totalMarksSum,
        obtainedMarks: obtainedMarksSum,
        percentage,
      };
    });
  };

  // Update student
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const updatedExams = recalculateExams(form.exams);
        const payload = { ...form, exams: updatedExams };
        await axios.put(`http://localhost:5000/api/students/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setForm({
        name: "",
        dob: "",
        email: "",
        course: "",
        password: "",
        phone: "",
        address: "",
        semester: "",
        division: "",
        exams: [],
      });
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/students/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchStudents();
  };

  // Edit
  const handleEdit = (student) => {
    setForm({
      ...student,
      password: "",
      exams: Array.isArray(student.exams) ? student.exams : [],
    });
    setEditingId(student._id);
  };

  const handleCancelEdit = () => {
    setForm({
      name: "",
      dob: "",
      email: "",
      course: "",
      password: "",
      phone: "",
      address: "",
      semester: "",
      division: "",
      exams: [],
    });
    setEditingId(null);
  };

  return (
    <div className="student-list-container">
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Student List</h1>
      <p className="page-subtitle">Filter by course and division to quickly find students.</p>

      {/* Controls: search + view toggle */}
      <div className="controls-row">
        <div className="search-box">
          <input
            placeholder="Search by name, email or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="view-toggle">
          <button className={`toggle-btn ${compact ? 'active' : ''}`} onClick={() => setCompact(!compact)}>
            {compact ? 'Grid View' : 'Compact View'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">Total Students</p>
          <p className="stat-value">{totalCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Filtered</p>
          <p className="stat-value accent">{filteredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <div className="filter-group">
          <label>Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedDivision("");
            }}
          >
            <option value="">All</option>
            {availableCourses.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Division</label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            disabled={!selectedCourse}
          >
            <option value="">{selectedCourse ? "All" : "Select course first"}</option>
            {availableDivisions.map((division) => (
              <option key={division} value={division}>{division}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Exam</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value="">Latest exam</option>
            {availableExams.map((examName) => (
              <option key={examName} value={examName}>
                {examName}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Student Cards */}
      <div className="cards-grid">
        {filteredStudents.map((s) => {
          const initials = s.name ? s.name.split(" ").map((n) => n[0]).slice(0,2).join("").toUpperCase() : "?";
          const exams = Array.isArray(s.exams) ? s.exams : [];
          const examToShow = (() => {
            if (exams.length === 0) return null;
            if (!selectedExam) {
              return exams[exams.length - 1]; // latest
            }
            return exams.find((ex) => ex.examName === selectedExam) || null;
          })();
          const subjectsToShow = examToShow && Array.isArray(examToShow.subjects)
            ? examToShow.subjects
            : [];
          return (
          <div key={s._id} className={`student-card ${compact ? 'compact' : ''}`}>
            <div className="card-header">
              <div className="card-left">
                <div className="avatar">{initials}</div>
                <div className="name-block">
                  <p className="card-name">{s.name}</p>
                  <p className="card-email">{s.email}</p>
                </div>
              </div>
              <div className="chip-row">
                <span className="pill pill-course">{s.course}</span>
                <span className="pill pill-sem">{s.semester}</span>
                <span className="pill pill-div">{s.division}</span>
              </div>
            </div>

            {!compact && (
            <>
            <div className="card-meta">
              <div><span className="meta-label">DOB</span><span>{s.dob}</span></div>
              <div><span className="meta-label">Phone</span><span>{s.phone}</span></div>
            </div>

              <div className="card-body">
              <div className="address-block">
                <span className="meta-label">Address</span>
                <p>{s.address}</p>
              </div>
                <div className="subjects-list">
                  {examToShow ? (
                    <>
                      <span className="subject-item exam-title">
                        <strong>{examToShow.examName || "Exam"}</strong>{" "}
                        ({examToShow.percentage ?? 0}%)
                      </span>
                      {subjectsToShow.length > 0 ? (
                        subjectsToShow.map((subject, idx) => (
                          <span key={idx} className="subject-item">
                            {subject.name}: {subject.obtainedMarks ?? 0}/
                            {subject.totalMarks ?? examToShow.perSubjectTotalMarks ?? "-"}
                          </span>
                        ))
                      ) : (
                        <span className="no-subjects">No subjects in this exam</span>
                      )}
                    </>
                  ) : (
                    <span className="no-subjects">
                      {selectedExam ? "No data for this exam" : "No exam data"}
                    </span>
                  )}
                </div>
            </div>
            </>
            )}

            <div className="card-actions">
              <button className="edit-btn" onClick={() => handleEdit(s)} title="Edit">
                <FaEdit />
              </button>
              <button className="delete-btn" onClick={() => handleDelete(s._id)} title="Delete">
                <FaTrash />
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="no-students">
          <p>No students found. Add some students to see the detailed list.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <h3>Edit Student</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>DOB:</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address:</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Semester:</label>
                <input
                  type="text"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Division:</label>
                <input
                  type="text"
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Course:</label>
                <input
                  type="text"
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  required
                />
              </div>
              <p className="edit-marks-hint">To update marks and exams, use <strong>Subject → Manage Marks & Exam</strong>.</p>
              <div className="form-buttons">
                <button type="submit" className="update-btn">Update</button>
                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;

