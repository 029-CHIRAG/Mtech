import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import "./FacultyDashboard.css";

const FacultyDashboard = () => {
  const { user } = useOutletContext(); // ✅ Access user from context
  const [facultyInfo, setFacultyInfo] = useState(null);

  useEffect(() => {
    if (!user || !user.email) return;
    
    const token = localStorage.getItem("token"); // Add this line
    
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/faculty/info/${user.email}`,
          {
            headers: { Authorization: `Bearer ${token}` }, // Add auth headers
          }
        );
        setFacultyInfo(res.data);
      } catch (error) {
        console.error("Failed to fetch faculty info", error);
        // Add this check for unauthorized responses
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login');
        }
      }
    };
  
    fetchData();
  }, [user]);

  if (!user) return <p>Loading user...</p>;

  return (
    <div className="faculty-dashboard-container">
      <div className="faculty-dashboard-card">
        <h2 className="faculty-dashboard-title">
          👩‍🏫 Welcome to Faculty Dashboard
        </h2>
  
        {facultyInfo ? (
          <div className="faculty-info">
            <p><strong>Name:</strong> {facultyInfo.name}</p>
            <p><strong>Email:</strong> {facultyInfo.email}</p>
            <p><strong>Department:</strong> {facultyInfo.department}</p>
            <p><strong>Contact:</strong> {facultyInfo.contact}</p>
            <p><strong>Bio:</strong> {facultyInfo.bio}</p>
          </div>
        ) : (
          <p className="loading-text">Loading faculty info...</p>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;