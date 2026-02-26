import React, { useState } from "react";
import axios from "axios";
import "./LoginPage.css";


function LoginPage({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpMessage, setFpMessage] = useState("");
  const [fpMessageType, setFpMessageType] = useState("");
  const [fpSendingOtp, setFpSendingOtp] = useState(false);
  const [fpChanging, setFpChanging] = useState(false);

  const API_BASE = "http://localhost:5000/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
        role,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      setUser({ role: res.data.role, token: res.data.token });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  const openForgot = () => {
    if (role !== "student") {
      setError("Forgot password is only for Student accounts. Contact admin for Teacher reset.");
      return;
    }
    setFpEmail(email || "");
    setFpOtp("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpMessage("");
    setFpMessageType("");
    setForgotOpen(true);
  };

  const closeForgot = () => {
    setForgotOpen(false);
  };

  const handleSendForgotOtp = async () => {
    setFpMessage("");
    setFpMessageType("");
    if (!fpEmail) {
      setFpMessage("Please enter your registered student email.");
      setFpMessageType("error");
      return;
    }
    setFpSendingOtp(true);
    try {
      const res = await axios.post(`${API_BASE}/students/forgot-password/send-otp`, { email: fpEmail.trim() });
      setFpMessage(res.data.message || "OTP sent to your email.");
      setFpMessageType("success");
      if (res.data.otpForDev) {
        setFpOtp(res.data.otpForDev);
      }
    } catch (err) {
      setFpMessage(err.response?.data?.message || "Failed to send OTP.");
      setFpMessageType("error");
    } finally {
      setFpSendingOtp(false);
    }
  };

  const handleForgotChangePassword = async (e) => {
    e.preventDefault();
    setFpMessage("");
    setFpMessageType("");
    if (!fpEmail || !fpOtp || !fpNewPassword || !fpConfirmPassword) {
      setFpMessage("Please fill all fields.");
      setFpMessageType("error");
      return;
    }
    if (fpNewPassword.length < 6) {
      setFpMessage("Password must be at least 6 characters.");
      setFpMessageType("error");
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpMessage("Passwords do not match.");
      setFpMessageType("error");
      return;
    }
    setFpChanging(true);
    try {
      const res = await axios.post(`${API_BASE}/students/forgot-password/change`, {
        email: fpEmail.trim(),
        otp: fpOtp.trim(),
        newPassword: fpNewPassword,
      });
      setFpMessage(res.data.message || "Password changed successfully.");
      setFpMessageType("success");
      setTimeout(() => {
        setForgotOpen(false);
      }, 1500);
    } catch (err) {
      setFpMessage(err.response?.data?.message || "Failed to change password.");
      setFpMessageType("error");
    } finally {
      setFpChanging(false);
    }
  };

  return (
    <div className="login-page-pro">
      <div className="login-left-msg">
        <h1>Welcome to Student-Teacher Portal</h1>
        <p>Manage students, view marks, and empower learning.<br/>Teachers can add students and assign marks.<br/>Students can view their progress anytime.</p>
      </div>
      <div className="login-form-card-pro">
        <h2>Welcome Back</h2>
        <p className="subtitle">Login to your {role.charAt(0).toUpperCase() + role.slice(1)} account</p>
        <div className="role-toggle-pro">
          <button
            className={role === "student" ? "active" : ""}
            onClick={() => setRole("student")}
          >
            Student
          </button>
          <button
            className={role === "teacher" ? "active" : ""}
            onClick={() => setRole("teacher")}
          >
            Teacher
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <div className="login-row">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            {role === "student" && (
              <button type="button" className="forgot-link" onClick={openForgot}>
                Forgot Password?
              </button>
            )}
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="login-btn-pro">Login</button>
        </form>
        {role === "student" && (
          <div className="signup-row">
            Don’t have an account? <button type="button" className="signup-link">Sign up</button>
          </div>
        )}
      </div>

      {forgotOpen && (
        <div className="forgot-overlay" onClick={closeForgot}>
          <div className="forgot-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="forgot-header">
              <h3>Reset Student Password</h3>
              <button type="button" className="forgot-close" onClick={closeForgot} aria-label="Close">
                ✕
              </button>
            </div>
            <p className="forgot-desc">
              Enter your registered <strong>student email</strong>. We will send a 6-digit OTP to your email. Then set a new password.
            </p>
            {fpMessage && (
              <div className={`forgot-alert forgot-alert-${fpMessageType}`}>
                {fpMessage}
              </div>
            )}
            <form className="forgot-form" onSubmit={handleForgotChangePassword}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                className="btn-send-otp"
                onClick={handleSendForgotOtp}
                disabled={fpSendingOtp || !fpEmail}
              >
                {fpSendingOtp ? "Sending OTP…" : "Send OTP"}
              </button>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={fpOtp}
                  onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
              <div className="form-group">
                <label>New password</label>
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={fpNewPassword}
                  onChange={(e) => setFpNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={fpConfirmPassword}
                  onChange={(e) => setFpConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="forgot-actions">
                <button type="button" className="btn-cancel" onClick={closeForgot}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={fpChanging}>
                  {fpChanging ? "Updating…" : "Change password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
