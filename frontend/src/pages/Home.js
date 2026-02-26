import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home({ user }) {
  const roleLabel = user?.role === "teacher" ? "Teacher" : user?.role === "student" ? "Student" : "Guest";
  const isTeacher = user?.role === "teacher";

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span className="badge-text">Welcome Back, {roleLabel}</span>
          </div>
          <h1 className="hero-title">
            Everything you need in one calm workspace
          </h1>
          <p className="hero-subtitle">
            Quick actions and intelligent tools whether you're managing students or tracking your progress.
          </p>
          <div className="hero-actions">
            {isTeacher && (
              <>
                <Link to="/students" className="btn btn-primary">
                  <span>➕</span> Add Student
                </Link>
                <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
                <Link to="/student-list" className="btn btn-secondary">Student List</Link>
              </>
            )}
            {!isTeacher && user?.role === "student" && (
              <>
                <Link to="/profile" className="btn btn-primary">
                  <span>👤</span> My Profile
                </Link>
                <Link to="/dashboard" className="btn btn-secondary">My Dashboard</Link>
              </>
            )}
            {!user?.role && <Link to="/dashboard" className="btn btn-primary">Explore</Link>}
          </div>
        </div>
        <div className="hero-cards">
          <div className="quick-card">
            <div className="card-header">
              <h3>Quick Access</h3>
            </div>
            <div className="quick-links">
              <Link to="/dashboard" className="quick-link">🎯 Dashboard</Link>
              {isTeacher ? (
                <>
                  <Link to="/students" className="quick-link">➕ Add Student</Link>
                  <Link to="/attendance" className="quick-link">✓ Attendance</Link>
                  <Link to="/fees" className="quick-link">💰 Fees</Link>
                </>
              ) : (
                <>
                  <Link to="/profile" className="quick-link">👤 Profile</Link>
                  <Link to="/fees" className="quick-link">💰 My Fees</Link>
                </>
              )}
            </div>
          </div>
          <div className="info-card">
            <div className="info-header">💡 Tip</div>
            <p className="info-text">Use keyboard shortcut Cmd+K to search and jump to any page instantly.</p>
            <div className="feature-tags">
              <span className="tag">Fast</span>
              <span className="tag">Smart</span>
              <span className="tag">Intuitive</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p>Everything designed for efficiency</p>
        </div>
        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Student Management</h3>
            <p>Organize and manage student details with ease. Add, edit, and track all information in one place.</p>
            {isTeacher && <Link to="/students" className="feature-link">Manage Students →</Link>}
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Smart Dashboard</h3>
            <p>Get a complete overview with analytics, trends, and insights at a glance.</p>
            <Link to="/dashboard" className="feature-link">Open Dashboard →</Link>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Attendance Tracking</h3>
            <p>Track attendance with precision. Mark and generate reports effortlessly.</p>
            {isTeacher && <Link to="/attendance" className="feature-link">View Attendance →</Link>}
          </div>
          <div className="feature-card highlight">
            <div className="feature-icon">💰</div>
            <h3>Fee Management</h3>
            <p>Manage fees by course and semester. Track payments and generate reports instantly.</p>
            <Link to="/fees" className="feature-link">Manage Fees →</Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-box">
          <div className="stat-number">∞</div>
          <div className="stat-label">Unlimited Students</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Always Available</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">⚡</div>
          <div className="stat-label">Lightning Fast</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">🔒</div>
          <div className="stat-label">Secure & Private</div>
        </div>
      </section>
    </div>
  );
}

export default Home;