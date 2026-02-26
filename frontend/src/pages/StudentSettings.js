import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTimes, FaCheck, FaKey, FaPaperPlane } from 'react-icons/fa';
import './StudentSettings.css';

const API_BASE = 'http://localhost:5000/api';

export default function StudentSettings() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    semester: '',
    division: '',
    course: ''
  });
  const [original, setOriginal] = useState({ ...form });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Change password dialog & OTP
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwMessageType, setPwMessageType] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/students/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data || {};
        const profileData = {
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          dob: data.dob ? data.dob.split('T')[0] : '',
          semester: data.semester || '',
          division: data.division || '',
          course: data.course || ''
        };
        setForm(profileData);
        setOriginal(profileData);
      } catch (err) {
        console.error(err);
        setMessage('Failed to load profile');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const openPasswordDialog = () => {
    setPwMessage('');
    setPwMessageType('');
    setOtpSent(false);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordDialog(true);
  };

  const closePasswordDialog = () => {
    setShowPasswordDialog(false);
    setOtpSent(false);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setPwMessage('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setMessage('');
  };

  const handleCancel = () => {
    setForm({ ...original });
    setIsEditing(false);
    setMessage('');
  };

  const handleSendOtp = async () => {
    setPwMessage('');
    setPwMessageType('');
    setSendingOtp(true);
    try {
      const res = await axios.post(`${API_BASE}/students/me/send-otp`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPwMessage(res.data.message || 'OTP sent to your email.');
      setPwMessageType('success');
      setOtpSent(true);
      setNewPassword('');
      setConfirmPassword('');
      if (res.data.otpForDev) {
        setOtp(res.data.otpForDev);
      } else {
        setOtp('');
      }
    } catch (err) {
      setPwMessage(err.response?.data?.message || 'Failed to send OTP.');
      setPwMessageType('error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePasswordWithOtp = async (e) => {
    e.preventDefault();
    setPwMessage('');
    setPwMessageType('');
    if (newPassword.length < 6) {
      setPwMessage('Password must be at least 6 characters.');
      setPwMessageType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage('Passwords do not match.');
      setPwMessageType('error');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await axios.post(
        `${API_BASE}/students/me/change-password-with-otp`,
        { otp: otp.trim(), newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwMessage(res.data.message || 'Password changed successfully.');
      setPwMessageType('success');
      setOtpSent(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordDialog(false);
        setPwMessage('');
      }, 1500);
    } catch (err) {
      setPwMessage(err.response?.data?.message || 'Failed to change password.');
      setPwMessageType('error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        dob: form.dob
      };
      const res = await axios.put(`${API_BASE}/students/me`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update original with new data
      const newData = {
        name: res.data.name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        dob: res.data.dob ? res.data.dob.split('T')[0] : '',
        semester: res.data.semester || '',
        division: res.data.division || '',
        course: res.data.course || ''
      };
      setOriginal(newData);
      setForm(newData);
      setMessage('Profile updated successfully ✓');
      setMessageType('success');
      setIsEditing(false);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
      setMessageType('error');
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>My Profile Settings</h1>
        <p className="subtitle">Manage your personal information</p>
      </div>

      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <div className="settings-container">
        {!isEditing ? (
          // View Mode
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {form.name ? form.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?'}
              </div>
              <div className="profile-info">
                <h2>{form.name}</h2>
                <p>{form.email}</p>
              </div>
              <div className="profile-header-actions">
                <button className="edit-button" onClick={handleEdit}>
                  <FaEdit /> Edit Profile
                </button>
                <button type="button" className="change-password-button" onClick={openPasswordDialog}>
                  <FaKey /> Change Password
                </button>
              </div>
            </div>

            <div className="profile-grid">
              <div className="profile-item">
                <label>Phone</label>
                <p>{form.phone || 'Not provided'}</p>
              </div>
              <div className="profile-item">
                <label>Address</label>
                <p>{form.address || 'Not provided'}</p>
              </div>
              <div className="profile-item">
                <label>Date of Birth</label>
                <p>{form.dob || 'Not provided'}</p>
              </div>
              <div className="profile-item">
                <label>Course</label>
                <p>{form.course || 'Not provided'}</p>
              </div>
              <div className="profile-item">
                <label>Semester</label>
                <p>{form.semester || 'Not provided'}</p>
              </div>
              <div className="profile-item">
                <label>Division</label>
                <p>{form.division || 'Not provided'}</p>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form className="edit-form" onSubmit={handleSubmit}>
            <div className="edit-header">
              <h2>Edit Personal Information</h2>
              <p>Update your profile details below</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit phone number"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Your address"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                <FaCheck /> Save Changes
              </button>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                <FaTimes /> Cancel
              </button>
              <button type="button" className="change-password-link" onClick={openPasswordDialog}>
                <FaKey /> Change Password
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change password dialog */}
      {showPasswordDialog && (
        <div className="password-dialog-overlay" onClick={closePasswordDialog}>
          <div className="password-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="password-dialog-header">
              <h3><FaKey /> Change Password</h3>
              <button type="button" className="password-dialog-close" onClick={closePasswordDialog} aria-label="Close">
                <FaTimes />
              </button>
            </div>
            <p className="password-dialog-desc">
              OTP will be sent to <strong>{form.email || 'your email'}</strong>. Click below to send, then enter the code and your new password.
            </p>
            <button
              type="button"
              className="btn-send-otp"
              onClick={handleSendOtp}
              disabled={sendingOtp || !form.email}
            >
              <FaPaperPlane /> {sendingOtp ? 'Sending…' : 'Send OTP to my email'}
            </button>
            {pwMessage && (
              <div className={`alert alert-${pwMessageType} password-dialog-alert`}>{pwMessage}</div>
            )}
            <form className="password-dialog-form" onSubmit={handleChangePasswordWithOtp}>
              <div className="form-group">
                <label>1. New password</label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>2. Confirm password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>3. OTP sent to email</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code from email"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <div className="password-dialog-actions">
                <button type="button" className="btn-cancel" onClick={closePasswordDialog}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={changingPassword}>
                  <FaCheck /> {changingPassword ? 'Updating…' : 'Change password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
