import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AttendanceReport.css";

function AttendanceReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [divisions, setDivisions] = useState([]);

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    course: "",
    division: "",
  });

  const token = localStorage.getItem("token");

  // Fetch students and extract unique courses/divisions
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(res.data);

        // Extract unique courses and divisions
        const uniqueCourses = [
          ...new Set(res.data.map((s) => s.course).filter(Boolean)),
        ];
        setCourses(uniqueCourses);

        if (filters.course) {
          const uniqueDivisions = [
            ...new Set(
              res.data
                .filter((s) => s.course === filters.course)
                .map((s) => s.division)
                .filter(Boolean)
            ),
          ];
          setDivisions(uniqueDivisions);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    fetchStudents();
  }, [token, filters.course]);

  // Update divisions when course changes
  useEffect(() => {
    if (filters.course) {
      const uniqueDivisions = [
        ...new Set(
          students
            .filter((s) => s.course === filters.course)
            .map((s) => s.division)
            .filter(Boolean)
        ),
      ];
      setDivisions(uniqueDivisions);
    } else {
      setDivisions([]);
    }
  }, [filters.course, students]);

  // Generate attendance report
  const generateReport = async () => {
    try {
      setLoading(true);
      setError("");

      if (!filters.startDate || !filters.endDate) {
        setError("Please select both start and end dates");
        setLoading(false);
        return;
      }

      if (new Date(filters.startDate) > new Date(filters.endDate)) {
        setError("Start date must be before end date");
        setLoading(false);
        return;
      }

      // Get attendance records
      const res = await axios.get("http://localhost:5000/api/attendance/report", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let filteredRecords = res.data;

      // Filter by date range (accounting for timezone)
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);

      filteredRecords = filteredRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });

      // Filter by course and division
      filteredRecords = filteredRecords.filter((record) => {
        const student = record.studentId;
        if (filters.course && student?.course !== filters.course) return false;
        if (filters.division && student?.division !== filters.division) return false;
        return true;
      });

      // Group by student and generate summary
      const reportData = {};
      filteredRecords.forEach((record) => {
        const studentId = record.studentId?._id;
        const studentName = record.studentId?.name;
        const studentEmail = record.studentId?.email;
        const course = record.studentId?.course;
        const division = record.studentId?.division;
        const semester = record.studentId?.semester;

        if (!reportData[studentId]) {
          reportData[studentId] = {
            studentId,
            name: studentName,
            email: studentEmail,
            course,
            division,
            semester,
            total: 0,
            present: 0,
            absent: 0,
            leave: 0,
            percentage: 0,
            records: [],
          };
        }

        reportData[studentId].total++;
        if (record.status === "Present") reportData[studentId].present++;
        else if (record.status === "Absent") reportData[studentId].absent++;
        else if (record.status === "Leave") reportData[studentId].leave++;

        reportData[studentId].records.push(record);
      });

      // Calculate percentages
      Object.values(reportData).forEach((student) => {
        student.percentage =
          student.total > 0
            ? ((student.present / student.total) * 100).toFixed(2)
            : 0;
      });

      setReports(Object.values(reportData));
    } catch (err) {
      console.error("Error generating report:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to generate report"
      );
    } finally {
      setLoading(false);
    }
  };

  // Download as CSV
  const downloadCSV = () => {
    if (reports.length === 0) {
      setError("No data to download. Generate a report first.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Student Name,Email,Course,Division,Semester,Total Classes,Present,Absent,Leave,Attendance %\n";

    reports.forEach((student) => {
      csvContent += `"${student.name}","${student.email}","${student.course}","${student.division}","${student.semester}",${student.total},${student.present},${student.absent},${student.leave},${student.percentage}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance_report_${filters.startDate}_to_${filters.endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="attendance-report-container">
      <h2>Attendance Report & Export</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Filter Section */}
      <div className="report-filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="startDate">From Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="endDate">To Date:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="course">Course:</label>
            <select
              id="course"
              name="course"
              value={filters.course}
              onChange={handleFilterChange}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="division">Division:</label>
            <select
              id="division"
              name="division"
              value={filters.division}
              onChange={handleFilterChange}
              disabled={!filters.course}
            >
              <option value="">All Divisions</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="button-group">
          <button
            className="btn-generate"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
          <button
            className="btn-download"
            onClick={downloadCSV}
            disabled={reports.length === 0}
          >
            📥 Download CSV
          </button>
        </div>
      </div>

      {/* Report Table */}
      {reports.length > 0 ? (
        <div className="report-wrapper">
          <div className="report-summary">
            <div className="summary-stat">
              <span className="label">Total Students:</span>
              <span className="value">{reports.length}</span>
            </div>
            <div className="summary-stat">
              <span className="label">Date Range:</span>
              <span className="value">
                {new Date(filters.startDate).toLocaleDateString()} to{" "}
                {new Date(filters.endDate).toLocaleDateString()}
              </span>
            </div>
            {filters.course && (
              <div className="summary-stat">
                <span className="label">Course:</span>
                <span className="value">{filters.course}</span>
              </div>
            )}
            {filters.division && (
              <div className="summary-stat">
                <span className="label">Division:</span>
                <span className="value">{filters.division}</span>
              </div>
            )}
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Division</th>
                  <th>Semester</th>
                  <th>Total</th>
                  <th className="present">Present</th>
                  <th className="absent">Absent</th>
                  <th className="leave">Leave</th>
                  <th className="percentage">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((student) => (
                  <tr
                    key={student.studentId}
                    className={
                      student.percentage >= 75
                        ? "high-attendance"
                        : "low-attendance"
                    }
                  >
                    <td className="student-name">{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.course}</td>
                    <td>{student.division}</td>
                    <td>{student.semester}</td>
                    <td className="total">{student.total}</td>
                    <td className="present">{student.present}</td>
                    <td className="absent">{student.absent}</td>
                    <td className="leave">{student.leave}</td>
                    <td className="percentage">
                      <span
                        className={
                          student.percentage >= 75
                            ? "badge-high"
                            : "badge-low"
                        }
                      >
                        {student.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-report">
          <p>Click "Generate Report" to see attendance data</p>
        </div>
      )}
    </div>
  );
}

export default AttendanceReport;
