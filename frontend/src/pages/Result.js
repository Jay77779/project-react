/*
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Result.css";
import logo from "../assets/logo.png";

const Result = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");

  const handleDownloadExam = (exam, idx) => {
    const examName = exam.examName || `Exam ${idx + 1}`;
    const subjects = exam.subjects || [];

    const html = `
      <html>
        <head>
          <title>${student?.name || "Student"} - ${examName} Result</title>
          <style>
            body { font-family: "Times New Roman", serif; padding: 24px 40px; color: #000; }
            .page { max-width: 900px; margin: 0 auto; }
            
            .university { text-align: center; font-size: 18px; font-weight: 700; text-transform: uppercase; }
            .college { text-align: center; font-size: 15px; margin-top: 4px; }
            .title { text-align: center; font-size: 16px; margin-top: 10px; text-transform: uppercase; }
            .exam-title { text-align: center; font-size: 15px; margin-top: 4px; }
            .info-table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13px; }
            .info-table td { border: 1px solid #000; padding: 6px 8px; }
            .info-label { width: 30%; font-weight: 600; }
            .marks-wrapper { margin-top: 20px; }
            .marks-header { text-align: center; font-weight: 600; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 4px; }
            th, td { border: 1px solid #000; padding: 6px 8px; text-align: center; }
            thead { background: #f3f4f6; }
            .footer-row { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; }
            .result-text { text-align: center; margin-top: 16px; font-size: 14px; font-weight: 600; }
            .notes { margin-top: 18px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="logoclg"><img src="${logoDataUrl}" alt="Logo" /></div>
            <div class="university">STUDENT CORNER</div>
            <div class="college">${student?.course || ""} DEPARTMENT</div>
            <div class="title">MARKS SHEET</div>
            <div class="exam-title">${examName}</div>

            <table class="info-table">
              <tr>
                <td class="info-label">Student Name</td>
                <td>${student?.name || "-"}</td>
                <td class="info-label">Course</td>
                <td>${student?.course || "-"}</td>
              </tr>
              <tr>
                <td class="info-label">Semester</td>
                <td>${student?.semester || "-"}</td>
                <td class="info-label">Division</td>
                <td>${student?.division || "-"}</td>
              </tr>
              <tr>
                <td class="info-label">Email / ID</td>
                <td>${student?.email || "-"}</td>
                <td class="info-label">Exam Session</td>
                <td>${new Date().getFullYear()}</td>
              </tr>
            </table>

            <div class="marks-wrapper">
              <div class="marks-header">Statement of Marks</div>
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Max Marks</th>
                    <th>Min Marks</th>
                    <th>Marks Obtained</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjects
                    .map(
                      (s) => `
                      <tr>
                        <td>${s.name || "-"}</td>
                        <td>${s.totalMarks ?? exam.perSubjectTotalMarks ?? "-"}</td>
                        <td>${Math.round(
                          (s.totalMarks ?? exam.perSubjectTotalMarks ?? 0) * 0.35
                        )}</td>
                        <td>${s.obtainedMarks ?? "-"}</td>
                      </tr>`
                    )
                    .join("")}
                  <tr>
                    <td><strong>Total</strong></td>
                    <td>${exam.totalMarks ?? 0}</td>
                    <td>-</td>
                    <td>${exam.obtainedMarks ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="result-text">
              Result: ${exam.percentage >= 35 ? "Passed" : "Failed"} (${exam.percentage ?? 0}%)
            </div>

            <div class="footer-row">
              <div>Officer In Charge</div>
              <div>Controller of Examinations</div>
            </div>

            <div class="notes">
              <strong>Note:</strong> This is a system generated marks sheet. For official use, refer to the college records.
            </div>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/students/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStudent(res.data);
      } catch (err) {
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    const loadLogo = async () => {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => setLogoDataUrl(reader.result);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to load logo:", err);
      }
    };

    fetchResults();
    loadLogo();
  }, []);

  if (loading) return <p style={{ padding: "20px" }}>Loading results...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;
  if (!student) return <p style={{ padding: "20px" }}>No data available.</p>;

  const exams = Array.isArray(student.exams) ? student.exams : [];

  return (
    <div className="result-page">
      <h2>My Exam Results</h2>

      {exams.length === 0 ? (
        <p>No exams available yet.</p>
      ) : (
        <div className="exam-results-list">
          {exams.map((exam, idx) => (
            <div key={idx} className="exam-card">
              <div className="exam-header">
                <h3>{exam.examName || `Exam ${idx + 1}`}</h3>
                <div className="exam-summary">
                  <span>Total Marks: {exam.totalMarks ?? 0}</span>
                  <span>Obtained: {exam.obtainedMarks ?? 0}</span>
                  <span>Percentage: {exam.percentage ?? 0}%</span>
                  <button
                    type="button"
                    className="download-btn"
                    onClick={() => handleDownloadExam(exam, idx)}
                  >
                    Download
                  </button>
                </div>
              </div>

              <table className="result-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Total Marks</th>
                    <th>Obtained Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {(exam.subjects || []).map((subj, sIdx) => (
                    <tr key={sIdx}>
                      <td>{subj.name}</td>
                      <td>{subj.totalMarks ?? exam.perSubjectTotalMarks ?? "-"}</td>
                      <td>{subj.obtainedMarks ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Result;
*/

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Result.css";
import logo from "../assets/logo.png"; // Keep your logo here

const Result = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");

  // Fetch student data
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/students/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data);
      } catch (err) {
        setError("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    // Convert logo to Base64
    const loadLogo = async () => {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoDataUrl(reader.result);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to load logo:", err);
      }
    };

    fetchResults();
    loadLogo();
  }, []);

const handleDownloadExam = (exam, idx) => {
  const examName = exam.examName || `Exam ${idx + 1}`;
  const subjects = exam.subjects || [];

  const html = `
    <html>
      <head>
        <title>${student?.name || "Student"} - ${examName} Result</title>
        <style>
          body {
            font-family: "Times New Roman", serif;
            padding: 24px 40px;
            color: #000;
          }
          .page {
            max-width: 900px;
            margin: 0 auto;
          }
          .university {
            text-align: center;
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .college {
            text-align: center;
            font-size: 15px;
            margin-top: 4px;
          }
          .title {
            text-align: center;
            font-size: 16px;
            margin-top: 10px;
            text-transform: uppercase;
          }
          .exam-title {
            text-align: center;
            font-size: 15px;
            margin-top: 4px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            font-size: 13px;
          }
          .info-table td {
            border: 1px solid #000;
            padding: 6px 8px;
          }
          .info-label {
            width: 30%;
            font-weight: 600;
          }
          .marks-wrapper {
            margin-top: 20px;
          }
          .marks-header {
            text-align: center;
            font-weight: 600;
            margin-bottom: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 4px;
          }
          th, td {
            border: 1px solid #000;
            padding: 6px 8px;
            text-align: center;
          }
          thead {
            background: #f3f4f6;
          }
          .result-text {
            text-align: center;
            margin-top: 16px;
            font-size: 14px;
            font-weight: 600;
          }
          .footer-row {
            margin-top: 50px;
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
            font-size: 12px;
          }
          .sign-block {
            text-align: center;
            width: 200px;
          }
          .sign-line {
            border-top: 1px solid #000;
            padding-top: 4px;
          }
          .stamp {
            margin-top: 6px;
          }
          .stamp img {
            width: 120px;
            opacity: 0.9;
          }
          .notes {
            margin-top: 22px;
            font-size: 11px;
          }
        </style>
      </head>

      <body>
        <div class="page">

          <!-- Logo -->
          <div style="text-align:center; margin-bottom:10px;">
            <img src="${logoDataUrl}" alt="Logo" style="height:90px;" />
          </div>

          <div class="university">STUDENT CORNER</div>
          <div class="college">${student?.course || ""} DEPARTMENT</div>
          <div class="title">MARKS SHEET</div>
          <div class="exam-title">${examName}</div>

          <!-- Student Info -->
          <table class="info-table">
            <tr>
              <td class="info-label">Student Name</td>
              <td>${student?.name || "-"}</td>
              <td class="info-label">Course</td>
              <td>${student?.course || "-"}</td>
            </tr>
            <tr>
              <td class="info-label">Semester</td>
              <td>${student?.semester || "-"}</td>
              <td class="info-label">Division</td>
              <td>${student?.division || "-"}</td>
            </tr>
            <tr>
              <td class="info-label">Email / ID</td>
              <td>${student?.email || "-"}</td>
              <td class="info-label">Exam Session</td>
              <td>${new Date().getFullYear()}</td>
            </tr>
          </table>

          <!-- Marks Table -->
          <div class="marks-wrapper">
            <div class="marks-header">Statement of Marks</div>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Max Marks</th>
                  <th>Min Marks</th>
                  <th>Marks Obtained</th>
                </tr>
              </thead>
              <tbody>
                ${subjects
                  .map(
                    (s) => `
                    <tr>
                      <td>${s.name || "-"}</td>
                      <td>${s.totalMarks ?? exam.perSubjectTotalMarks ?? "-"}</td>
                      <td>${Math.round((s.totalMarks ?? exam.perSubjectTotalMarks ?? 0) * 0.35)}</td>
                      <td>${s.obtainedMarks ?? "-"}</td>
                    </tr>`
                  )
                  .join("")}
                <tr>
                  <td><strong>Total</strong></td>
                  <td>${exam.totalMarks ?? 0}</td>
                  <td>-</td>
                  <td>${exam.obtainedMarks ?? 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="result-text">
            Result: ${exam.percentage >= 35 ? "Passed" : "Failed"} (${exam.percentage ?? 0}%)
          </div>

          <!-- SIGNATURE + STAMP -->
          <div class="footer-row">
            

            <div class="sign-block">
              <div class="stamp">
                <img src="/stamp.png" alt="College Stamp" />
              </div>
              <div class="sign-line">Controller of Examinations</div>
            </div>
          </div>

          <div class="notes">
            <strong>Note:</strong> This is a system generated marks sheet. For official use, refer to the college records.
          </div>

        </div>
      </body>
    </html>
  `;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};

  if (loading) return <p style={{ padding: "20px" }}>Loading results...</p>;
  if (error) return <p style={{ padding: "20px", color: "red" }}>{error}</p>;
  if (!student) return <p style={{ padding: "20px" }}>No data available.</p>;

  const exams = Array.isArray(student.exams) ? student.exams : [];

  return (
    <div className="result-page">
      <h2>My Exam Results</h2>
      {exams.length === 0 ? (
        <p>No exams available yet.</p>
      ) : (
        <div className="exam-results-list">
          {exams.map((exam, idx) => (
            <div key={idx} className="exam-card">
              <div className="exam-header">
                <h3>{exam.examName || `Exam ${idx + 1}`}</h3>
                <div className="exam-summary">
                  <span>Total Marks: {exam.totalMarks ?? 0}</span>
                  <span>Obtained: {exam.obtainedMarks ?? 0}</span>
                  <span>Percentage: {exam.percentage ?? 0}%</span>
                  <button
                    type="button"
                    className="download-btn"
                    onClick={() => handleDownloadExam(exam, idx)}
                  >
                    Download
                  </button>
                </div>
              </div>

              <table className="result-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Total Marks</th>
                    <th>Obtained Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {(exam.subjects || []).map((subj, sIdx) => (
                    <tr key={sIdx}>
                      <td>{subj.name}</td>
                      <td>{subj.totalMarks ?? exam.perSubjectTotalMarks ?? "-"}</td>
                      <td>{subj.obtainedMarks ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Result;
