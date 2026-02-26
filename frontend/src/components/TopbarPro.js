import React from "react";
import { FaBell, FaEnvelope, FaSearch } from "react-icons/fa";
import "./TopbarPro.css";

function TopbarPro({ user }) {
  return (
    <header className="topbar-pro">
      <div className="topbar-left">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search..." />
        </div>
      </div>
      <div className="topbar-right">
        <FaEnvelope className="topbar-icon" />
        <FaBell className="topbar-icon" />
        <div className="user-info">
          <div className="user-avatar">{user?.role?.charAt(0).toUpperCase()}</div>
          <span className="user-name">{user?.role === "teacher" ? "Teacher" : "Student"}</span>
        </div>
      </div>
    </header>
  );
}

export default TopbarPro;
