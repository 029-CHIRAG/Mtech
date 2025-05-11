import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, { headers })
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("Failed to fetch user data", err);
        navigate("/login");
      });
  }, [token, userId, navigate]);

  useEffect(() => {
    if (user?.email) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/student/dashboard?email=${user.email}`, { headers })
        .then((res) => {
          console.log("✅ Dashboard data fetched:", res.data);
          setDashboardData(res.data.dashboardData);
        })
        .catch((err) => {
          console.error("❌ Failed to fetch dashboard data", err);
        });
    }
  }, [user?.email]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const handleImageClick = () => fileInputRef.current.click();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitial = (name) => name?.charAt(0).toUpperCase() || "?";

  if (!user) return <div className="loading">Loading user data...</div>;
  if (!dashboardData) return <div className="loading">Loading dashboard data...</div>;

  return (
    <div className={`dashboard ${darkMode ? "dark" : ""}`}>
      {/* Header */}
      <div className="header">
        <h1>🎓 Student Dashboard</h1>
        <div className="toggle-wrapper">
          <label className="switch">
            <input
              type="checkbox"
              onChange={() => setDarkMode(!darkMode)}
              checked={darkMode}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-pic" onClick={handleImageClick}>
          {user.profileImage ? (
            <img src={user.profileImage} alt="avatar" />
          ) : (
            <div className="avatar-initial">{getInitial(user.name)}</div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>
        <div className="user-meta">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="role-badge">{user.role}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Grid Cards */}
      <div className="grid-cards">
        <div className="card glass">
          <h3>📚 Enrolled Courses</h3>
          {dashboardData.courses?.length ? (
            <ul>{dashboardData.courses.map((c, i) => <li key={i}>{c}</li>)}</ul>
          ) : (
            <p>No courses enrolled</p>
          )}
        </div>

        <div className="card glass">
          <h3>📈 CGPA Overview</h3>
          <p>CGPA: {dashboardData.cgpa || "N/A"}</p>
          <p>Last GPA: {dashboardData.lastGpa || "N/A"}</p>
        </div>

        <div className="card glass">
          <h3>📝 Assignments</h3>
          {dashboardData.assignments?.length ? (
            <ul>{dashboardData.assignments.map((a, i) => <li key={i}>{a}</li>)}</ul>
          ) : (
            <p>No assignments</p>
          )}
        </div>

        <div className="card glass">
          <h3>📅 Schedule</h3>
          {dashboardData.schedule?.length ? (
            <ul>{dashboardData.schedule.map((s, i) => <li key={i}>{s}</li>)}</ul>
          ) : (
            <p>No schedule</p>
          )}
        </div>

        <div className="card glass">
          <h3>📢 Announcements</h3>
          <p>{dashboardData.announcements || "No announcements"}</p>
        </div>

        <div className="card glass">
          <h3>🧾 Activity</h3>
          <p>{dashboardData.activity || "No recent activity"}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;