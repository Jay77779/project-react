import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AttendanceForm.css";

function AttendanceForm() {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: "",
    date: new Date().toISOString().split("T")[0],
    subject: "",
    status: "Present",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (!token) {
          setMessage("No authentication token found. Please login again.");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(res.data);
      } catch (error) {
        console.error("Error fetching students:", error);
        setMessage(error.response?.data?.message || error.response?.data?.error || "Failed to fetch students");
      }
    };
    fetchStudents();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!formData.studentId) {
        setMessage("❌ Please select a student");
        setLoading(false);
        return;
      }

      if (!token) {
        setMessage("❌ Authentication token missing. Please login again.");
        setLoading(false);
        return;
      }

      console.log("Sending attendance data:", formData);
      console.log("Token:", token);

      const response = await axios.post(
        "http://localhost:5000/api/attendance/mark",
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      console.log("Attendance marked successfully:", response.data);
      setMessage("✅ Attendance marked successfully!");
      setFormData({
        studentId: "",
        date: new Date().toISOString().split("T")[0],
        subject: "",
        status: "Present",
        remarks: "",
      });

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error marking attendance:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error message:", error.message);
      
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to mark attendance. Please try again.";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-form-container">
      <h2>Mark Student Attendance</h2>

      {message && <div className="message">{message}</div>}

      <form onSubmit={handleSubmit} className="attendance-form">
        <div className="form-group">
          <label htmlFor="studentId">Student Name</label>
          <select
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            required
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.name} - {student.email}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Enter subject name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="remarks">Remarks (Optional)</label>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Add any remarks"
            rows="3"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Marking..." : "Mark Attendance"}
        </button>
      </form>
    </div>
  );
}

export default AttendanceForm;
