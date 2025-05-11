import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "./Notifications.css";

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/student-notifications/student-notifications`,
        getAuthHeaders()
      );
      setNotifications(res.data.notifications || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load notifications. Please try again."
      );
      setLoading(false);
    }
  };

  const markAsRead = async (applicationId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/student-notifications/mark-comments-read/${applicationId}`,
        {},
        getAuthHeaders()
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.applicationId === applicationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error("Error marking comments as read:", err);
      setError(
        err.response?.data?.message ||
          "Failed to mark comments as read. Please try again."
      );
    }
  };

  // Function to map technical field names to user-friendly labels
  const getFieldLabel = (field, fieldData) => {
    if (field.startsWith("document_") && fieldData.documentType) {
      return fieldData.documentType; // e.g., "Aadhaar Card", "Marksheet"
    }
    switch (field) {
      case "fullName":
        return "Full Name";
      case "email":
        return "Email";
      case "phoneNumber":
        return "Phone Number";
      case "currentAddress":
        return "Current Address";
      case "tenth":
        return "10th Education Details";
      case "twelth":
        return "12th Education Details";
      case "graduation":
        return "Graduation Details";
      case "postgraduate":
        return "Postgraduate Details";
      case "payment":
        return "Payment Details";
      default:
        return field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in to view notifications.");
      setLoading(false);
      return;
    }

    if (currentUser?.role === "student") {
      fetchNotifications();
    } else if (currentUser) {
      setError("Unauthorized access. Please log in as a student.");
      setLoading(false);
    }
  }, [currentUser]);

  return (
    <div className="notifications-container">
      <h1>Notifications</h1>
      {error && <div className="notifications-error">{error}</div>}
      {loading ? (
        <div className="notifications-loading">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">No notifications available.</div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.applicationId}
              className={`notification-card ${notification.read ? "read" : "unread"}`}
            >
              <div className="notification-header">
                <h3>{notification.courseTitle}</h3>
                <span className="notification-date">
                  {new Date(notification.updatedAt).toLocaleString()}
                </span>
              </div>
              <p>
                <strong>From:</strong> {notification.officerName}
              </p>
              {notification.generalComment && (
                <div className="notification-comment">
                  <strong>General Comment:</strong>
                  <p>{notification.generalComment}</p>
                </div>
              )}
              {Object.keys(notification.fieldComments).length > 0 && (
                <div className="notification-comment">
                  <strong>Field Comments:</strong>
                  <ul>
                    {Object.entries(notification.fieldComments).map(([field, data]) => (
                      <li key={field}>
                        <strong>{getFieldLabel(field, data)}:</strong> {data.comment}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notification.applicationId)}
                  >
                    <FaCheckCircle /> Mark as Read
                  </button>
                )}
                <span className={`notification-status ${notification.read ? "read" : "unread"}`}>
                  {notification.read ? (
                    <>
                      <FaCheckCircle /> Read
                    </>
                  ) : (
                    <>
                      <FaTimesCircle /> Unread
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;