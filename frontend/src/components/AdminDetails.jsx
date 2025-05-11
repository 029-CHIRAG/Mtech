import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminDetails.css"; // Optional for styling

const AdminDetails = () => {
  const { id } = useParams();  // Get admin ID from URL
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Ensure only admin data is fetched
        if (res.data.role === "content_admin") {
          setAdmin(res.data);
        } else {
          setError("This user is not an admin.");
        }
      } catch (err) {
        console.error("Error fetching admin details:", err);
        setError("Failed to load admin details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDetails();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-details-container">
      <div className="admin-details">
        <h2>Admin Details</h2>
        <p><strong>Name:</strong> {content_admin.name}</p>
        <p><strong>Email:</strong> {content_admin.email}</p>
        <p><strong>Role:</strong> {content_admin.role}</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">Go Back</button>
      </div>
    </div>
  );
  
};

export default AdminDetails;