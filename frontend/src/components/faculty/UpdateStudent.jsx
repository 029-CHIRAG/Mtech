import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./UpdateStudent.css";

import {
  FaRegEdit, FaRegListAlt, FaGraduationCap, FaTasks,
  FaCalendarAlt, FaBullhorn, FaRunning, FaArrowLeft
} from 'react-icons/fa';

export default function UpdateStudent() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [data, setData] = useState({
    courses: "",
    cgpa: "",
    lastGpa: "",
    assignments: "",
    schedule: "",
    announcements: "",
    activity: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (studentId) {
      setEmail(studentId);
      setData({
        courses: "",
        cgpa: "",
        lastGpa: "",
        assignments: "",
        schedule: "",
        announcements: "",
        activity: "",
      });

      // Fetch student name
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/faculty/student-info/${studentId}`)
        .then((res) => {
          setStudentName(res.data.name || "Unknown Student");
        })
        .catch((err) => {
          console.error("Failed to fetch student info:", err);
          setStudentName("Unknown Student");
        });
    }
  }, [studentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      email,
      courses: data.courses.split(",").map((c) => c.trim()).filter(Boolean),
      cgpa: data.cgpa,
      lastGpa: data.lastGpa,
      assignments: data.assignments.split(",").map((a) => a.trim()).filter(Boolean),
      schedule: data.schedule.split(",").map((s) => s.trim()).filter(Boolean),
      announcements: data.announcements,
      activity: data.activity,
    };

    try {
      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/faculty/update-student`, payload);
      setSuccessMessage("✅ Student dashboard updated successfully!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("❌ Failed to update student data.");
      setSuccessMessage("");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="update-student-container">
      {/* Feedback messages */}
      <div className="message-container">
        {successMessage && <div className="success-message">{successMessage}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>

      {/* Header */}
      <div className="header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft />
          Back
        </button>
        <h2>Update Student Dashboard</h2>
        <FaRegEdit className="edit-icon" />
      </div>

      {/* Student name display */}
      {studentName && (
        <h3 className="student-identifier">Updating: {studentName}</h3>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="update-student-form">
        <input type="hidden" name="email" value={email} />

        <div className="input-group">
          <FaGraduationCap className="input-icon" />
          <input
            type="text"
            name="courses"
            placeholder="Courses (comma-separated)"
            value={data.courses}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <FaRegListAlt className="input-icon" />
          <input
            type="text"
            name="cgpa"
            placeholder="CGPA"
            value={data.cgpa}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <FaTasks className="input-icon" />
          <input
            type="text"
            name="lastGpa"
            placeholder="Last Semester GPA"
            value={data.lastGpa}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <FaTasks className="input-icon" />
          <input
            type="text"
            name="assignments"
            placeholder="Assignments (comma-separated)"
            value={data.assignments}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <FaCalendarAlt className="input-icon" />
          <input
            type="text"
            name="schedule"
            placeholder="Schedule (comma-separated)"
            value={data.schedule}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <FaBullhorn className="input-icon" />
          <input
            type="text"
            name="announcements"
            placeholder="Announcements"
            value={data.announcements}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="input-group">
          <FaRunning className="input-icon" />
          <input
            type="text"
            name="activity"
            placeholder="Recent Activity"
            value={data.activity}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <button type="submit" className="submit-btn">Update Student</button>
      </form>
    </div>
  );
}