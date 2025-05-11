import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./EditFacultyDashboard.css";

const EditFacultyDashboard = () => {
  const [info, setInfo] = useState({
    name: "",
    department: "",
    contact: "",
    bio: "",
  });

  const [userEmail, setUserEmail] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken) {
      console.log("Token missing, redirecting to login");
      navigate("/login");
      return;
    }

    setToken(storedToken);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserEmail(parsedUser.email);
      } catch (err) {
        console.error("Error parsing stored user:", err);
        const userId = localStorage.getItem("userId");
        if (userId) {
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          })
          .then(res => {
            setUserEmail(res.data.email);
          })
          .catch(err => {
            console.error("Failed to fetch user email:", err);
            navigate("/login");
          });
        } else {
          console.log("No user ID found, redirecting to login");
          navigate("/login");
        }
      }
    } else {
      const userId = localStorage.getItem("userId");
      if (userId) {
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        .then(res => {
          setUserEmail(res.data.email);
        })
        .catch(err => {
          console.error("Failed to fetch user email:", err);
          navigate("/login");
        });
      } else {
        console.log("No user ID found, redirecting to login");
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const fetchFacultyInfo = async () => {
      if (!userEmail || !token) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/faculty/info/${userEmail}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { name, department, contact, bio } = res.data;
        setInfo({
          name: name || "",
          department: department || "",
          contact: contact || "",
          bio: bio || "",
        });
      } catch (err) {
        console.error("Failed to fetch faculty info:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    if (userEmail && token) {
      fetchFacultyInfo();
    }
  }, [userEmail, token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!userEmail || !token) {
      setErrorMessage("User not authenticated.");
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/faculty/info`,
        {
          email: userEmail,
          name: info.name,
          department: info.department,
          contact: info.contact,
          bio: info.bio,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage("✅ Faculty info updated successfully!");
    } catch (err) {
      console.error("Failed to update faculty info", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMessage("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        setErrorMessage("Error updating info: " + (err.response?.data?.message || "Unknown error"));
      }
    }
  };

  const handleBackToDashboard = () => {
    navigate("/faculty");
  };

  return (
    <div className="edit-faculty-page">
      <div className="message-container">
        {successMessage && <div className="success-message">{successMessage}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>

      <div className="edit-faculty-card">
        <h2 className="edit-faculty-title">✨ Edit Your Faculty Info ✨</h2>

        {loading ? (
          <p className="loading-text">Loading faculty info...</p>
        ) : (
          <>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={info.name}
              onChange={handleChange}
              className="edit-faculty-input"
            />
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={info.department}
              onChange={handleChange}
              className="edit-faculty-input"
            />
            <input
              type="text"
              name="contact"
              placeholder="Contact Number"
              value={info.contact}
              onChange={handleChange}
              className="edit-faculty-input"
            />
            <textarea
              name="bio"
              placeholder="Write a short bio..."
              value={info.bio}
              onChange={handleChange}
              rows={5}
              className="edit-faculty-textarea"
            />
            <div className="button-container">
              <button
                onClick={handleSubmit}
                className="edit-faculty-button"
              >
                💾 Save Changes
              </button>

              <button
                onClick={handleBackToDashboard}
                className="back-button"
              >
                🏠 Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditFacultyDashboard;