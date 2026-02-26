import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUserPlus, FaList, FaCog, FaSignOutAlt, FaHome, FaUser, FaClipboard, FaMoneyBillWave, FaPoll, FaBook, FaChartLine } from "react-icons/fa";
import "./SidebarPro.css";

function SidebarPro({ role, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar-pro">
      <div className="sidebar-header">STUDENT CORNER</div>
      <ul className="sidebar-menu">
        <li className={isActive("/") ? "active" : ""}>
          <Link to="/"><FaHome /> Home</Link>
        </li>
        <li className={isActive("/dashboard") ? "active" : ""}>
          <Link to="/dashboard"><FaUser /> Dashboard</Link>
        </li>
        {role === "teacher" && (
          <>
            <li className={isActive("/students") ? "active" : ""}>
              <Link to="/students"><FaUserPlus /> Add Student</Link>
            </li>
            <li className={isActive("/student-list") ? "active" : ""}>
              <Link to="/student-list"><FaList /> Student List</Link>
            </li>
            <li className={isActive("/attendance") ? "active" : ""}>
              <Link to="/attendance"><FaClipboard /> Attendance</Link>
            </li>
            <li className={isActive("/fees") ? "active" : ""}>
              <Link to="/fees"><FaMoneyBillWave /> Fees</Link>
            </li>
            <li className={isActive("/subject") ? "active" : ""}>
              <Link to="/subject"><FaBook /> Subject</Link>
            </li>
            <li className={isActive("/marks") ? "active" : ""}>
              <Link to="/marks"><FaChartLine /> Marks</Link>
            </li>
          </>
        )}
        {role === "student" && (
          <>
            <li className={isActive("/profile") ? "active" : ""}>
              <Link to="/profile"><FaUser /> Profile</Link>
            </li>
            <li className={isActive("/attendance") ? "active" : ""}>
              <Link to="/attendance"><FaClipboard /> Attendance</Link>
            </li>
            <li className={isActive("/fees") ? "active" : ""}>
              <Link to="/fees"><FaMoneyBillWave /> Fees</Link>
            </li>
            <li className={isActive("/result") ? "active" : ""}>
              <Link to="/result">
                <FaPoll /> Result
              </Link>
            </li>
          </>
        )}
        <li className={isActive("/settings") ? "active" : ""}>
          <Link to="/settings"><FaCog /> Settings</Link>
        </li>
        <li><button className="sidebar-logout" onClick={onLogout}><FaSignOutAlt /> Logout</button></li>
      </ul>
    </aside>
  );
}

export default SidebarPro;
