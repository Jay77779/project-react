
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SidebarPro from "./components/SidebarPro";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentList from "./pages/StudentList";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import About from "./pages/About";
import LoginPage from "./components/LoginPage";
import StudentProfile from "./pages/StudentProfile";
import StudentSettings from "./pages/StudentSettings";
import TeacherSettings from "./pages/TeacherSettings";
import Home from "./pages/Home";
import Result from "./pages/Result";
import Subject from "./pages/Subject";
import Marks from "./pages/Marks";
import "./App.css";



function App() {
  const [user, setUser] = useState({
    role: localStorage.getItem("role"),
    token: localStorage.getItem("token"),
  });

  const isAuthenticated = user && user.token;

  return (
  <Router future={{ v7_relativeSplatPath: true }}>
      {!isAuthenticated ? (
        <Routes>
          <Route path="*" element={<LoginPage setUser={setUser} />} />
        </Routes>
      ) : (
        <>
          <div style={{ display: 'flex' }}>
            {user.role && <SidebarPro role={user.role} onLogout={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              window.location.reload();
            }} />}
            <div className="main" style={user.role ? { marginLeft: 240, width: '100%' } : {}}>
              <Routes>
                <Route path="/" element={<Home user={user} />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                {user.role === "teacher" && <Route path="/students" element={<Students />} />}
                {user.role === "teacher" && <Route path="/student-list" element={<StudentList />} />}
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/fees" element={<Fees />} />
                {user.role === "teacher" && <Route path="/subject" element={<Subject />} />}
                {user.role === "teacher" && <Route path="/marks" element={<Marks />} />}
                <Route path="/about" element={<About />} />
                {user.role === "student" && <Route path="/profile" element={<StudentProfile />} />}
                {user.role === "student" && <Route path="/settings" element={<StudentSettings />} />}
                {user.role === "teacher" && <Route path="/settings" element={<TeacherSettings />} />}
                {user.role === "student" && <Route path="/result" element={<Result />} />}
              </Routes>
            </div>
          </div>
        </>
      )}
    </Router>
  );
}

export default App;






