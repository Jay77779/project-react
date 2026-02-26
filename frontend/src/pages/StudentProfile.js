import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGraduationCap, FaBook, FaCalendarAlt, FaIdCard } from "react-icons/fa";
import "./StudentProfile.css";

function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/students/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data);
      } catch (err) {
        setError("Failed to load profile");
      }
    };
    fetchProfile();
  }, [token]);

  if (error) return <div className="error-message">{error}</div>;
  if (!student) return <div className="loading-message">Loading your profile...</div>;

  return (
    <div className="student-profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <FaUser className="avatar-icon" />
        </div>
        <div className="profile-info">
          <h1>{student.name}</h1>
          <p className="profile-title">Student • {student.course}</p>
          <p className="profile-subtitle">{student.semester} {student.division}</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Personal Information */}
        <div className="profile-section">
          <h2><FaIdCard className="section-icon" /> Personal Information</h2>
          <div className="info-grid">
            <div className="info-card">
              <FaUser className="info-icon" />
              <div className="info-content">
                <label>Full Name</label>
                <span>{student.name}</span>
              </div>
            </div>
            <div className="info-card">
              <FaCalendarAlt className="info-icon" />
              <div className="info-content">
                <label>Date of Birth</label>
                <span>{student.dob}</span>
              </div>
            </div>
            <div className="info-card">
              <FaEnvelope className="info-icon" />
              <div className="info-content">
                <label>Email Address</label>
                <span>{student.email}</span>
              </div>
            </div>
            <div className="info-card">
              <FaPhone className="info-icon" />
              <div className="info-content">
                <label>Phone Number</label>
                <span>{student.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="profile-section">
          <h2><FaGraduationCap className="section-icon" /> Academic Information</h2>
          <div className="info-grid">
            <div className="info-card">
              <FaBook className="info-icon" />
              <div className="info-content">
                <label>Course</label>
                <span>{student.course}</span>
              </div>
            </div>
            <div className="info-card">
              <FaGraduationCap className="info-icon" />
              <div className="info-content">
                <label>Semester</label>
                <span>{student.semester}</span>
              </div>
            </div>
            <div className="info-card">
              <FaBook className="info-icon" />
              <div className="info-content">
                <label>Division</label>
                <span>{student.division}</span>
              </div>
            </div>
            <div className="info-card">
              <FaBook className="info-icon" />
              <div className="info-content">
                <label>Total Subjects</label>
                <span>{student.subjects ? student.subjects.length : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="profile-section">
          <h2><FaMapMarkerAlt className="section-icon" /> Contact Information</h2>
          <div className="info-card full-width">
            <FaMapMarkerAlt className="info-icon" />
            <div className="info-content">
              <label>Address</label>
              <span>{student.address}</span>
            </div>
          </div>
        </div>

        {/* Subjects & Marks */}
        {student.subjects && student.subjects.length > 0 && (
          <div className="profile-section">
            <h2><FaBook className="section-icon" /> Subjects & Marks</h2>
            <div className="subjects-grid">
              {student.subjects.map((subj, idx) => (
                <div key={idx} className="subject-card">
                  <div className="subject-header">
                    <h3>{subj.name}</h3>
                    <div className={`mark-badge ${subj.marks >= 80 ? 'excellent' : subj.marks >= 70 ? 'good' : subj.marks >= 60 ? 'average' : 'poor'}`}>
                      {subj.marks}%
                    </div>
                  </div>
                  <div className="subject-progress">
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${subj.marks >= 80 ? 'excellent' : subj.marks >= 70 ? 'good' : subj.marks >= 60 ? 'average' : 'poor'}`}
                        style={{ width: `${subj.marks}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{subj.marks}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;
