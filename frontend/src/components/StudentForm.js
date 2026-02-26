
import React from "react";
import { FaUser, FaGraduationCap } from "react-icons/fa";
import "./StudentForm.css";

function StudentForm({ form, setForm, handleSubmit, editingId, handleCancelEdit }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e);
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{editingId ? "Edit Student" : "Add New Student"}</h2>
      </div>

      <form onSubmit={handleFormSubmit} className="student-form">
        <div className="form-grid">
          
          <div className="form-section">
            <h3><FaUser /> Personal Information</h3>
            <div className="input-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input name="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={(e) => handleChange({ target: { name: "phone", value: e.target.value.replace(/\D/g, "") } })}
                maxLength={10}
              />
            </div>
            <div className="input-group">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={form.dob} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Address</label>
              <textarea name="address" value={form.address} onChange={handleChange}></textarea>
            </div>
          </div>

         
          <div className="form-section">
            <h3><FaGraduationCap /> Academic Information</h3>
            <div className="input-group">
              <label>Course</label>
              <select name="course" value={form.course} onChange={handleChange}>
                <option value="">Select</option>
                <option value="BBA">BBA</option>
                <option value="BCA">BCA</option>
                <option value="BCOM">BCOM</option>
                <option value="B.ED">B.ED</option>
              </select>
            </div>
            <div className="input-group">
              <label>Semester</label>
              <select name="semester" value={form.semester} onChange={handleChange}>
                <option value="">Select</option>
                <option value="SEM-1">SEM-1</option>
                <option value="SEM-2">SEM-2</option>
                <option value="SEM-3">SEM-3</option>
                <option value="SEM-4">SEM-4</option>
                <option value="SEM-5">SEM-5</option>
                <option value="SEM-6">SEM-6</option>
              </select>
            </div>
            <div className="input-group">
              <label>Division</label>
              <input name="division" value={form.division} onChange={handleChange} maxLength={1} />
            </div>
            {!editingId && (
              <div className="input-group">
                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} />
              </div>
            )}
          </div>
        </div>

        <div className="form-buttons">
          <button type="submit" className="submit-btn">{editingId ? "Update Student" : "Add Student"}</button>
          {editingId && <button type="button" className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}

export default StudentForm;






