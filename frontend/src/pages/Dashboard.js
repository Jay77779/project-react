import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer
} from "recharts";
import { FaUsers, FaGraduationCap, FaBookOpen, FaTrophy, FaChartLine, FaAward } from "react-icons/fa";
import "./Dashboard.css";


function Dashboard({ user }) {
  const [totalStudents, setTotalStudents] = useState(0);
  const [, setStudents] = useState([]);
  const [courseData, setCourseData] = useState([]);
  const [semesterData, setSemesterData] = useState([]);
  const [divisionData, setDivisionData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    if (user.role === "teacher") {
      axios.get("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then(res => {
          setTotalStudents(res.data.length);
          setStudents(res.data);
          
          // Process data for charts
          processChartData(res.data);
        })
        .catch(() => {
          setTotalStudents(0);
          setStudents([]);
          setCourseData([]);
          setSemesterData([]);
          setDivisionData([]);
          setSubjectData([]);
        });
    }
  }, [user]);

  const processChartData = (studentData) => {
    // Course distribution
    const courseCount = {};
    const semesterCount = {};
    const divisionCount = {};
    const subjectMarks = {};

    studentData.forEach(student => {
      // Course data
      courseCount[student.course] = (courseCount[student.course] || 0) + 1;
      
      // Semester data
      semesterCount[student.semester] = (semesterCount[student.semester] || 0) + 1;
      
      // Division data
      divisionCount[student.division] = (divisionCount[student.division] || 0) + 1;
      
      // Subject marks data (from latest exam, based on exams structure)
      if (Array.isArray(student.exams) && student.exams.length > 0) {
        const latestExam = student.exams[student.exams.length - 1];
        (latestExam.subjects || []).forEach(subject => {
          const name = subject.name;
          const marks = subject.obtainedMarks ?? 0;
          if (!name) return;
          if (!subjectMarks[name]) {
            subjectMarks[name] = { total: 0, count: 0 };
          }
          subjectMarks[name].total += marks;
          subjectMarks[name].count += 1;
        });
      }
    });

    // Convert to chart data format
    setCourseData(Object.entries(courseCount).map(([name, value]) => ({ name, value })));
    setSemesterData(Object.entries(semesterCount).map(([name, value]) => ({ name, value })));
    setDivisionData(Object.entries(divisionCount).map(([name, value]) => ({ name, value })));
    
    const avgSubjectData = Object.entries(subjectMarks).map(([name, data]) => ({
      name,
      average: Math.round(data.total / data.count)
    }));
    setSubjectData(avgSubjectData);
  };

  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [studentStats, setStudentStats] = useState({
    totalMarks: 0,
    averageMarks: 0,
    highestMark: 0,
    totalSubjects: 0,
  });
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);

  useEffect(() => {
    if (user.role === "student") {
      axios.get("http://localhost:5000/api/students/me", {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then(res => {
          setStudent(res.data);
          const exams = Array.isArray(res.data.exams) ? res.data.exams : [];
          if (exams.length > 0) {
            // Use latest exam for student stats & charts
            const latestIndex = exams.length - 1;
            const latestExam = exams[latestIndex];
            const subjects = latestExam.subjects || [];
            const marks = subjects.map(subj => subj.obtainedMarks ?? 0);
            const total = marks.reduce((sum, mark) => sum + mark, 0);
            const highest = marks.length ? Math.max(...marks) : 0;
            const average = marks.length ? Math.round(total / marks.length) : 0;

            setSelectedExamIndex(latestIndex);
            setStudentStats({
              totalMarks: total,
              averageMarks: average,
              highestMark: highest,
              totalSubjects: subjects.length,
            });
          } else {
            setStudentStats({
              totalMarks: 0,
              averageMarks: 0,
              highestMark: 0,
              totalSubjects: 0,
            });
          }
        })
        .catch(() => setError("Failed to load profile"));
    }
  }, [user]);

  return (
    <div className="dashboard-container">
      {user.role === "teacher" && (
        <>
          {/* Dashboard Cards */}
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <FaUsers className="card-icon" />
              <div>
                <h3>Total Students</h3>
                <p className="card-value">{totalStudents}</p>
              </div>
            </div>
            <div className="dashboard-card">
              <FaGraduationCap className="card-icon" />
              <div>
                <h3>Total Courses</h3>
                <p className="card-value">{courseData.length}</p>
              </div>
            </div>
            <div className="dashboard-card">
              <FaBookOpen className="card-icon" />
              <div>
                <h3>Total Semesters</h3>
                <p className="card-value">{semesterData.length}</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            {/* Course Distribution Pie Chart */}
            <div className="chart-card">
              <h3>Students by Course</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={courseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {courseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Semester Distribution Bar Chart */}
            <div className="chart-card">
              <h3>Students by Semester</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={semesterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Division Distribution Bar Chart */}
            <div className="chart-card">
              <h3>Students by Division</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={divisionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Average Marks by Subject Line Chart */}
            <div className="chart-card">
              <h3>Average Marks by Subject</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="average" stroke="#ff7300" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </>
      )}
      {user.role === "student" && (
        <>
          {/* Student Dashboard Cards */}
          <div className="dashboard-cards">
            <div className="dashboard-card student-card">
              <FaTrophy className="card-icon gold" />
              <div>
                <h3>Average Marks</h3>
                <p className="card-value">{studentStats.averageMarks}%</p>
              </div>
            </div>
            <div className="dashboard-card student-card">
              <FaChartLine className="card-icon blue" />
              <div>
                <h3>Total Marks</h3>
                <p className="card-value">{studentStats.totalMarks}</p>
              </div>
            </div>
            <div className="dashboard-card student-card">
              <FaAward className="card-icon green" />
              <div>
                <h3>Highest Mark</h3>
                <p className="card-value">{studentStats.highestMark}%</p>
              </div>
            </div>
            <div className="dashboard-card student-card">
              <FaBookOpen className="card-icon purple" />
              <div>
                <h3>Subjects</h3>
                <p className="card-value">{studentStats.totalSubjects}</p>
              </div>
            </div>
          </div>

          {/* Student Charts */}
          {student && Array.isArray(student.exams) && student.exams.length > 0 && (
            <div className="charts-grid">
              {(() => {
                const exams = student.exams || [];
                const exam = exams[selectedExamIndex] || exams[exams.length - 1];
                const subjects = (exam && exam.subjects) ? exam.subjects : [];
                const chartData = subjects.map(subj => ({
                  subject: subj.name,
                  marks: subj.obtainedMarks ?? 0,
                }));
                const performanceData = [
                  { name: 'Excellent (90-100)', value: subjects.filter(s => (s.obtainedMarks ?? 0) >= 90).length },
                  { name: 'Good (80-89)', value: subjects.filter(s => {
                    const m = s.obtainedMarks ?? 0;
                    return m >= 80 && m < 90;
                  }).length },
                  { name: 'Average (70-79)', value: subjects.filter(s => {
                    const m = s.obtainedMarks ?? 0;
                    return m >= 70 && m < 80;
                  }).length },
                  { name: 'Below Average', value: subjects.filter(s => (s.obtainedMarks ?? 0) < 70).length },
                ];

                return (
                  <>
                    {/* Marks Bar Chart */}
                    <div className="chart-card">
                      <h3>📊 My Subject Marks</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="marks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Performance Pie Chart */}
                    <div className="chart-card">
                      <h3>🎯 Performance Overview</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={performanceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {performanceData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Quick Info Card */}
          {student && (
            <div className="student-info-card">
              <h3>👋 Welcome back, {student.name}!</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Class:</span>
                  <span className="info-value">{student.semester} {student.division}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Course:</span>
                  <span className="info-value">{student.course}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{student.email}</span>
                </div>
              </div>
              {Array.isArray(student.exams) && student.exams.length > 0 && (() => {
                const exam = student.exams[selectedExamIndex] || student.exams[student.exams.length - 1];
                const subjects = (exam && exam.subjects) ? exam.subjects : [];
                return subjects.length > 0;
              })() && (
                <div className="quick-marks">
                  <h4>📚 Quick Marks Overview</h4>
                  <div className="marks-list">
                    {(() => {
                      const exam = student.exams[selectedExamIndex] || student.exams[student.exams.length - 1];
                      const subjects = (exam && exam.subjects) ? exam.subjects : [];
                      return subjects.map((subj, idx) => {
                        const m = subj.obtainedMarks ?? 0;
                        const cls = m >= 80 ? 'excellent' : m >= 70 ? 'good' : m >= 60 ? 'average' : 'poor';
                        return (
                      <div key={idx} className="mark-item">
                        <span className="subject-name">{subj.name}</span>
                          <span className={`mark-value ${cls}`}>
                            {m}%
                        </span>
                      </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <div className="error">{error}</div>}
          {!student && !error && <div className="loading">Loading your dashboard...</div>}
        </>
      )}
    </div>
  );
}

export default Dashboard;
