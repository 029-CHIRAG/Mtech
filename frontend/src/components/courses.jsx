import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./courses.css";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  const [editCourse, setEditCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    duration: "",
    fee: "",
    requirement: "",
    contact: "",
    subjectCode: "",
    assignedTo: "",
    deadline: "",
  });

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      navigate("/login");
      return;
    }

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Unauthorized. Please log in.");
        if (!res.ok) throw new Error("Failed to fetch courses.");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched courses:", data);
        setCourses(data);
      })
      .catch((err) => {
        console.error("Error fetching courses:", err);
        alert(err.message);
      });

    window.scrollTo(0, 0);
  }, [currentUser, loading, navigate]);

  const handleEdit = (course) => {
    setEditCourse(course);
    setEditFormData({
      title: course.title || "",
      description: course.description || "",
      duration: course.duration || "",
      fee: course.fee || "",
      requirement: course.requirement || "",
      contact: course.contact || "",
      subjectCode: course.subjectCode || "",
      assignedTo: course.assignedTo || "",
      deadline: course.deadline ? new Date(course.deadline).toISOString().split("T")[0] : "",
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    const missingFields = [];
    if (!editFormData.title.trim()) missingFields.push("title");
    if (!editFormData.description.trim()) missingFields.push("description");
    if (!editFormData.duration || isNaN(editFormData.duration) || editFormData.duration <= 0)
      missingFields.push("duration");
    if (!editFormData.fee || isNaN(editFormData.fee) || editFormData.fee <= 0)
      missingFields.push("fee");
    if (!editFormData.requirement.trim()) missingFields.push("requirement");
    if (!editFormData.contact.trim()) missingFields.push("contact");
    if (!editFormData.subjectCode.trim()) missingFields.push("subjectCode");
    if (!editFormData.assignedTo.trim()) missingFields.push("assignedTo");

    if (missingFields.length > 0) {
      alert(`Please fill in all fields: ${missingFields.join(", ")}`);
      return;
    }

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/${editCourse._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        duration: Number(editFormData.duration),
        fee: Number(editFormData.fee),
        requirement: editFormData.requirement.trim(),
        contact: editFormData.contact.trim(),
        subjectCode: editFormData.subjectCode.trim(),
        assignedTo: editFormData.assignedTo.trim(),
        deadline: editFormData.deadline || null,
      }),
    })
      .then((res) => {
        if (res.status === 403) throw new Error("Access denied. Admins only.");
        if (!res.ok) throw new Error("Failed to update course.");
        return res.json();
      })
      .then((response) => {
        setCourses(
          courses.map((c) => (c._id === editCourse._id ? response.course : c))
        );
        setEditCourse(null);
        alert("Course updated successfully!");
      })
      .catch((err) => {
        console.error("Error updating course:", err);
        alert(err.message);
      });
  };

  const handleDelete = (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (res.status === 403) throw new Error("Access denied. Admins only.");
        if (!res.ok) throw new Error("Failed to delete course.");
        return res.json();
      })
      .then(() => {
        setCourses(courses.filter((c) => c._id !== courseId));
        alert("Course deleted successfully!");
      })
      .catch((err) => {
        console.error("Error deleting course:", err);
        alert(err.message);
      });
  };

  const handleTogglePause = (courseId, isPaused) => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}/toggle-pause`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (res.status === 403) throw new Error("Access denied. Content Admins only.");
        if (!res.ok) throw new Error("Failed to toggle pause status.");
        return res.json();
      })
      .then((response) => {
        setCourses(
          courses.map((c) => (c._id === courseId ? response.course : c))
        );
        alert(`Course ${isPaused ? "unpaused" : "paused"} successfully!`);
      })
      .catch((err) => {
        console.error("Error toggling pause status:", err);
        alert(err.message);
      });
  };

  const isCourseExpired = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return "Not set";
    try {
      return new Date(deadline).toLocaleDateString();
    } catch (e) {
      console.error("Invalid deadline date:", deadline);
      return "Invalid date";
    }
  };

  if (loading) return <div className="courses-page-container"><p>Loading courses...</p></div>;

  return (
    <div className="courses-page-container">
      <h1 className="courses-page-title">Explore Our Courses</h1>

      <div className="courses-page-search-container">
        <input
          type="text"
          className="courses-page-search-input"
          placeholder="What do you want to learn?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="courses-page-grid">
        {courses
          .filter((course) => course.title.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((course) => (
            <div key={course._id} className="courses-page-card">
              <div className="courses-page-code">{course.subjectCode || "No Code"}</div>
              <h2 className="courses-page-title">{course.title}</h2>

              {isCourseExpired(course.deadline) ? (
                <p className="courses-page-description" style={{ color: "#e74c3c", fontWeight: "bold" }}>
                  This course is out of deadline
                </p>
              ) : (
                <>
                  <p className="courses-page-description">{course.description}</p>
                  <p className="courses-page-detail"><strong>Duration:</strong> {course.duration} years</p>
                  <p className="courses-page-detail"><strong>Fee:</strong> ₹{course.fee}</p>
                  <p className="courses-page-detail"><strong>Contact Details:</strong> {course.contact}</p>
                  <p className="courses-page-detail"><strong>Requirements:</strong> {course.requirement}</p>
                  <p className="courses-page-detail"><strong>Assigned To:</strong> {course.assignedTo}</p>
                  <p className="courses-page-detail"><strong>Application Deadline:</strong> {formatDeadline(course.deadline)}</p>
                  {course.isPaused && (
                    <p className="courses-page-description" style={{ color: "#f39c12", fontWeight: "bold" }}>
                      Deadline crossed can't fill form
                    </p>
                  )}
                </>
              )}

              {currentUser?.role === "student" && !isCourseExpired(course.deadline) && !course.isPaused && (
                <Link to={`/courses/${course._id}`}>
                  <button className="courses-page-explore-btn">Explore</button>
                </Link>
              )}

              {currentUser?.role === "content_admin" && !isCourseExpired(course.deadline) && (
                <div className="courses-page-admin-btns">
                  <Link to={`/content-admin/add-description/${course._id}`}>
                    <button className="courses-page-admin-btn">Add Description</button>
                  </Link>
                  <button
                    className="courses-page-admin-btn"
                    onClick={() => handleTogglePause(course._id, course.isPaused)}
                  >
                    {course.isPaused ? "Unpause" : "Pause"} Applications
                  </button>
                </div>
              )}

              {currentUser?.role === "admin" && (
                <div className="courses-page-admin-btns">
                  <button className="courses-page-admin-btn" onClick={() => handleEdit(course)}>
                    Edit
                  </button>
                  <button className="courses-page-admin-btn" onClick={() => handleDelete(course._id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {currentUser?.role === "admin" && (
        <Link to="/add-course">
          <button className="courses-page-add-btn">Add New Course</button>
        </Link>
      )}

      {editCourse && (
        <div className="courses-page-edit-modal">
          <div className="courses-page-edit-content">
            <h2>Edit Course</h2>
            <form onSubmit={handleEditSubmit} className="courses-page-form-container">
              <input type="text" name="title" placeholder="Course Title" value={editFormData.title} onChange={handleEditChange} required />
              <textarea name="description" placeholder="Course Description" value={editFormData.description} onChange={handleEditChange} required />
              <input type="number" name="duration" placeholder="Duration (in years)" value={editFormData.duration} onChange={handleEditChange} required />
              <input type="number" name="fee" placeholder="Fee (in ₹)" value={editFormData.fee} onChange={handleEditChange} required />
              <input type="text" name="requirement" placeholder="Requirements" value={editFormData.requirement} onChange={handleEditChange} required />
              <input type="text" name="contact" placeholder="Contact Details" value={editFormData.contact} onChange={handleEditChange} required />
              <input type="text" name="subjectCode" placeholder="Subject Code" value={editFormData.subjectCode} onChange={handleEditChange} required />
              <input type="email" name="assignedTo" placeholder="Assigned Content Admin Email" value={editFormData.assignedTo} onChange={handleEditChange} required />
              <input type="date" name="deadline" placeholder="Application Deadline" value={editFormData.deadline} onChange={handleEditChange} />
              <div className="courses-page-modal-btns">
                <button type="submit" className="courses-page-modal-btn courses-page-modal-btn-save">Save Changes</button>
                <button type="button" className="courses-page-modal-btn courses-page-modal-btn-cancel" onClick={() => setEditCourse(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
