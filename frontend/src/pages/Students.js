import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import StudentForm from "../components/StudentForm";
import "./Students.css";


function Students() {
  const [, setStudents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    course: "",
    password: "",
    phone: "",
    address: "",
    semester: "",
    division: "",
    exams: [], // exams structure used by StudentForm
  });

  const token = localStorage.getItem("token");

  // Fetch all students
  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Add / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/students/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("http://localhost:5000/api/students", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setForm({
        name: "",
        dob: "",
        email: "",
        course: "",
        password: "",
        phone: "",
        address: "",
        semester: "",
        division: "",
        exams: [],
      });
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setForm({
      name: "",
      dob: "",
      email: "",
      course: "",
      password: "",
      phone: "",
      address: "",
      semester: "",
      division: "",
      exams: [],
    });
    setEditingId(null);
  };

  return (
    <div className="students-container">
      <h1 style={{ textAlign: "center" }}>Add Student</h1>
      <StudentForm
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        editingId={editingId}
        handleCancelEdit={handleCancelEdit}
      />
    </div>
  );
}

export default Students;


