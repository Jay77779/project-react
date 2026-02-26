import React, { useState } from "react";
import "./StudentList.css";

function StudentList({ students, handleEdit, handleDelete }) {
  return (
    <div>
      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>DOB</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Semester</th>
            <th>Division</th>
            <th>Course</th>
            <th>Latest Exam & Marks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const exams = Array.isArray(s.exams) ? s.exams : [];
            const latestExam = exams.length > 0 ? exams[exams.length - 1] : null;
            const subjects = latestExam && latestExam.subjects ? latestExam.subjects : [];

            return (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.dob}</td>
                <td>{s.phone}</td>
                <td>{s.address}</td>
                <td>{s.semester}</td>
                <td>{s.division}</td>
                <td>{s.course}</td>
                <td>
                  {latestExam ? (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      <li>
                        <strong>{latestExam.examName || "Latest Exam"}</strong>{" "}
                        ({latestExam.percentage ?? 0}%)
                      </li>
                      {subjects.map((subj, idx) => (
                        <li key={idx}>
                          {subj.name}: {subj.obtainedMarks ?? 0}/
                          {subj.totalMarks ?? latestExam.perSubjectTotalMarks ?? "-"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>No exam data</span>
                  )}
                </td>
                <td>
                  <button onClick={() => handleEdit(s)}>Edit</button>
                  <button onClick={() => handleDelete(s._id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default StudentList;






