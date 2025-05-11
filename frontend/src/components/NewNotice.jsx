import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";

const NewNotice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (location.state && location.state.notice) {
      const { notice } = location.state;
      setTitle(notice.title);
      setDescription(notice.description || "");
      setLink(notice.link || "");
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    if (!title.trim() || !description.trim()) {
      alert("Title and Description are required!");
      return;
    }

    try {
      if (id) {
        // Update existing notice
        const res = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/notices/${id}`,
          { title, description, link },
          {
            headers: {
              Authorization: `Bearer ${token}`, // Fixed to use Bearer
            },
          }
        );
        console.log("Notice updated:", res.data);
      } else {
        // Create new notice
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/notices`,
          { title, description, link },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Notice created:", res.data);
      }

      navigate("/");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("Unauthorized: Please log in as a content admin.");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
      } else {
        console.error("Failed to submit notice:", error);
        alert("Failed to submit notice. Please try again.");
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2>{id ? "Edit Notice" : "Add New Notice"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Notice Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group mt-2">
          <label>Notice Description</label>
          <textarea
            className="form-control"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="form-group mt-2">
          <label>Link (optional)</label>
          <input
            type="text"
            className="form-control"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-success mt-3">
          {id ? "Update Notice" : "Create Notice"}
        </button>
      </form>
    </div>
  );
};

export default NewNotice;