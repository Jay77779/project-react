import React from "react";
import { Link } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ role }) {
  if (role !== "teacher") return null;
  return (
    <aside className="sidebar">
      <ul>
        <li><Link to="/students">Add Student</Link></li>
        <li><Link to="/student-list">Student List</Link></li>
      </ul>
    </aside>
  );
}

export default Sidebar;
