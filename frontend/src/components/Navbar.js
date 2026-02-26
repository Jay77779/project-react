
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";



function Navbar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
    window.location.reload();
  };

  return (
    <nav className="navbar flat-navbar">
      <div className="navbar-center-title">Student-Teacher Portal</div>
      <div style={{ position: "absolute", right: "2.5rem" }}>
        <Link to="/about" className="navbar-about-link">About</Link>
      </div>
    </nav>
  );
}

export default Navbar;



