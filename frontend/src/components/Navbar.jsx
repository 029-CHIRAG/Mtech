import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { FaUserCircle, FaBell } from "react-icons/fa";
import axios from "axios";
import "./Navbar.css";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  {/*route for fetching unread notifications. */}
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchUnreadCount = async () => {
    if (!currentUser || currentUser.role !== "student") return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/student-notifications/student-notifications`,
        getAuthHeaders()
      );
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching unread notifications:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleDashboardRedirect = () => {
    if (currentUser?.role === "admin") {
      navigate("/Admindashboard");
    } else if (currentUser?.role === "content_admin") {
      navigate("/contentAdmin");
    } else if (currentUser?.role === "student") {
      navigate("/dashboard");
    } else if (currentUser?.role === "faculty") {
      navigate("/faculty");
    } else if (currentUser?.role === "verification_admin") {
      navigate("/verification-admin");
    } else if (currentUser?.role === "verification_officer") {
      navigate("/verification-officer");
    } else {
      navigate("/");
    }
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsDropdownOpen(false);
  };

  const handleChangePassword = () => {
    navigate("/change-password");
    setIsDropdownOpen(false);
  };

  const handleNotifications = () => {
    navigate("/notifications");
    setIsDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/images/nitt.png" alt="NITT Logo" />
        NIT Trichy E-Campus
      </div>

      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/courses">Courses</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        {currentUser && currentUser.role === "student" && (
          <li><Link to="/payment">Payment</Link></li>
        )}
      </ul>

      <div className="navbar-search">
        <input type="text" placeholder="Search..." />
        <button>Search</button>
      </div>
      {/*For notification fetching */}
      {currentUser ? (
        <div className="navbar-user-menu">
          {currentUser.role === "student" && (
            <div className="notification-icon" onClick={handleNotifications}>
              <FaBell size={28} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </div>
          )}
          <div
            className="user-icon"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <FaUserCircle size={32} />
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button onClick={handleDashboardRedirect}>Dashboard</button>
              <button onClick={handleChangePassword}>Change Password</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="login-link">Login</Link>
      )}
    </nav>
  );
};

export default Navbar;