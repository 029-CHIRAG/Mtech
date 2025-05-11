import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUser, FaSearch } from "react-icons/fa";
import "./StudentList.css";

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      navigate("/login");
      return;
    }
    setToken(storedToken);

    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/faculty/students`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        setStudents(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Failed to load students. Please try again.");
        setLoading(false);

        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
    };

    fetchStudents();
  }, [navigate]);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentClick = (email) => {
    navigate(`/faculty/update-student/${email}`);
  };

  if (loading) return <div className="loading">Loading students...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="student-list-container">
      <h2 className="student-list-title">🌟 Student Directory</h2>

      <div className="search-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="students-list">
        {filteredStudents.length === 0 ? (
          <p className="no-students">No students found.</p>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student._id}
              className="student-item"
              onClick={() => handleStudentClick(student.email)}
            >
              <div className="student-icon">
                <FaUser />
              </div>
              <div className="student-info">
                <h3 className="student-name">{student.name}</h3>
                <p className="student-email">{student.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentList;