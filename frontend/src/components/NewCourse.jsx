import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './newCourse.css';

const NewCourse = () => {
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    duration: "",
    fee: "",
    requirement: "",
    contact: "",
    subjectCode: "",
    assignedTo: "",
    deadline: "", // New field
  });
  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedUser = JSON.parse(atob(token.split(".")[1]));
        setUser(decodedUser);
      } catch (err) {
        console.error("Token decoding failed:", err);
        setUser(null);
      }
    }
  }, []);

  const handleChange = (e) => {
    setCourseData({ ...courseData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!courseData.title.trim()) newErrors.title = "Course Title is required";
    if (!courseData.description.trim()) newErrors.description = "Description is required";
    if (!courseData.duration || isNaN(courseData.duration) || courseData.duration <= 0)
      newErrors.duration = "Valid duration (in years) is required";
    if (!courseData.fee || isNaN(courseData.fee) || courseData.fee <= 0)
      newErrors.fee = "Valid fee is required";
    if (!courseData.requirement.trim()) newErrors.requirement = "Requirements are required";
    if (!courseData.contact.trim()) newErrors.contact = "Contact Details are required";
    if (!courseData.subjectCode.trim()) newErrors.subjectCode = "Subject Code is required";
    if (!courseData.assignedTo.trim()) newErrors.assignedTo = "Assigned Content Admin email is required";
    if (courseData.deadline && isNaN(Date.parse(courseData.deadline)))
      newErrors.deadline = "Valid deadline date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || user.role !== "admin") {
      alert("Access Denied: Only admins can add courses.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    const requestBody = {
      title: courseData.title,
      description: courseData.description,
      duration: Number(courseData.duration),
      fee: Number(courseData.fee),
      requirement: courseData.requirement,
      contact: courseData.contact,
      subjectCode: courseData.subjectCode,
      assignedTo: courseData.assignedTo,
      deadline: courseData.deadline || null,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/newCourse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          if (responseData.missingFields) {
            throw new Error(`Missing or invalid fields: ${responseData.missingFields.join(", ")}`);
          } else if (responseData.errors) {
            throw new Error(`Validation errors: ${responseData.errors.join(", ")}`);
          } else {
            throw new Error(responseData.message || "Invalid request data");
          }
        } else if (response.status === 401) {
          throw new Error("Unauthorized. Please log in.");
        } else if (response.status === 403) {
          throw new Error("Access denied. Admins only.");
        } else {
          throw new Error(responseData.message || "Something went wrong. Please try again.");
        }
      }

      alert("Course added successfully!");
      navigate("/courses");
    } catch (err) {
      console.error("Error adding course:", err);
      alert(`Error adding course: ${err.message}`);
    }
  };

  return (
    <div className="new-course-form-container" style={{ marginTop: "80px" }}>
      <h2>Add a New Course</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Course Title"
          value={courseData.title}
          onChange={handleChange}
          required
        />
        {errors.title && <div className="error">{errors.title}</div>}
        <textarea
          name="description"
          placeholder="Course Description"
          value={courseData.description}
          onChange={handleChange}
          required
        />
        {errors.description && <div className="error">{errors.description}</div>}
        <input
          type="number"
          name="duration"
          placeholder="Duration (in years)"
          value={courseData.duration}
          onChange={handleChange}
          required
        />
        {errors.duration && <div className="error">{errors.duration}</div>}
        <input
          type="number"
          name="fee"
          placeholder="Fee (in ₹)"
          value={courseData.fee}
          onChange={handleChange}
          required
        />
        {errors.fee && <div className="error">{errors.fee}</div>}
        <input
          type="text"
          name="requirement"
          placeholder="Requirements"
          value={courseData.requirement}
          onChange={handleChange}
          required
        />
        {errors.requirement && <div className="error">{errors.requirement}</div>}
        <input
          type="text"
          name="contact"
          placeholder="Contact Details"
          value={courseData.contact}
          onChange={handleChange}
          required
        />
        {errors.contact && <div className="error">{errors.contact}</div>}
        <input
          type="text"
          name="subjectCode"
          placeholder="Subject Code"
          value={courseData.subjectCode}
          onChange={handleChange}
          required
        />
        {errors.subjectCode && <div className="error">{errors.subjectCode}</div>}
        <input
          type="email"
          name="assignedTo"
          placeholder="Assigned Content Admin Email"
          value={courseData.assignedTo}
          onChange={handleChange}
          required
        />
        {errors.assignedTo && <div className="error">{errors.assignedTo}</div>}
        <input
          type="date"
          name="deadline"
          placeholder="Application Deadline"
          value={courseData.deadline}
          onChange={handleChange}
        />
        {errors.deadline && <div className="error">{errors.deadline}</div>}
        <button type="submit">Add Course</button>
      </form>
    </div>
  );
};

export default NewCourse;
