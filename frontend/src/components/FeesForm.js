import React, { useState, useEffect } from "react";
import axios from "axios";
import "./FeesForm.css";

function FeesForm() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    course: "",
    semester: "",
    amount: "",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30))
      .toISOString()
      .split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showStudentList, setShowStudentList] = useState(false);
  const token = localStorage.getItem("token");

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(res.data);

        // Extract unique courses and semesters
        const uniqueCourses = [...new Set(res.data.map((s) => s.course))];
        setCourses(uniqueCourses);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, [token]);

  // Get students for selected course and semester
  const getStudentsForCourseSemester = () => {
    return students.filter(
      (s) => s.course === formData.course && s.semester === formData.semester
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSelectedStudents([]);
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    const courseStudents = getStudentsForCourseSemester();
    if (selectedStudents.length === courseStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(courseStudents.map((s) => s._id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!formData.course || !formData.semester) {
        setMessage("❌ Please select course and semester");
        setLoading(false);
        return;
      }

      if (!formData.amount || formData.amount <= 0) {
        setMessage("❌ Please enter a valid amount");
        setLoading(false);
        return;
      }

      if (selectedStudents.length === 0) {
        setMessage("❌ Please select at least one student");
        setLoading(false);
        return;
      }

      console.log("Submitting fees for students:", {
        course: formData.course,
        semester: formData.semester,
        amount: formData.amount,
        dueDate: formData.dueDate,
        studentIds: selectedStudents,
      });

      // Create fees for each selected student
      for (const studentId of selectedStudents) {
        await axios.post(
          "http://localhost:5000/api/fees/create",
          {
            studentId,
            course: formData.course,
            semester: formData.semester,
            amount: parseFloat(formData.amount),
            dueDate: formData.dueDate,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      setMessage(
        `✅ Fees created successfully for ${selectedStudents.length} student(s)!`
      );
      setFormData({
        course: "",
        semester: "",
        amount: "",
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30))
          .toISOString()
          .split("T")[0],
      });
      setSelectedStudents([]);
      setShowStudentList(false);

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error creating fees:", error);
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create fees. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const courseStudents = getStudentsForCourseSemester();
  const semesters = formData.course
    ? [...new Set(students.filter((s) => s.course === formData.course).map((s) => s.semester))]
    : [];

  return (
    <div className="fees-form-container">
      {message && (
        <div className={`message ${message.includes("❌") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="fees-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="course">Course</label>
            <select
              id="course"
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="semester">Semester</label>
            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              disabled={!formData.course}
              required
            >
              <option value="">Select semester</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="0"
              step="100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {formData.course && formData.semester && (
          <div className="student-selection-section">
            <div className="section-header">
              <h3>Select Students for {formData.course} - Semester {formData.semester}</h3>
              <button
                type="button"
                className="btn-toggle-list"
                onClick={() => setShowStudentList(!showStudentList)}
              >
                {showStudentList ? "Hide Students" : `Show ${courseStudents.length} Students`}
              </button>
            </div>

            {showStudentList && courseStudents.length > 0 && (
              <div className="student-list">
                <div className="student-list-header">
                  <label className="select-all">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === courseStudents.length && courseStudents.length > 0}
                      onChange={handleSelectAll}
                    />
                    <span>Select All ({selectedStudents.length}/{courseStudents.length})</span>
                  </label>
                </div>

                <div className="student-grid">
                  {courseStudents.map((student) => (
                    <label key={student._id} className="student-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleStudentToggle(student._id)}
                      />
                      <span>{student.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {showStudentList && courseStudents.length === 0 && (
              <div className="no-students">No students found for this course and semester</div>
            )}
          </div>
        )}

        <button type="submit" className="btn-submit" disabled={loading || selectedStudents.length === 0}>
          {loading
            ? "Creating Fees..."
            : `Create Fees for ${selectedStudents.length} Student(s)`}
        </button>
      </form>
    </div>
  );
}

export default FeesForm;
