import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RoleCreation.css'; // Reuse existing CSS for consistency

const VerificationOfficerCreation = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'verification_officer',
    courseId: '',
  });
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        setError('Failed to load courses. Please try again.');
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!formData.password.trim()) {
      setError('Password is required.');
      return;
    }
    if (!formData.courseId) {
      setError('Please select a course.');
      return;
    }

    // Log the payload for debugging
    console.log('Submitting formData:', formData);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setSuccess(res.data.message);
      console.log('Form submitted successfully, navigating to /verification-admin');
      setTimeout(() => {
        navigate('/verification-admin');
        console.log('Navigation triggered');
      }, 1000);
    } catch (err) {
      console.error('Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to create verification officer.');
    }
  };

  return (
    <div className="role-creation-container">
      <div className="role-creation-form">
        <h2>Create Verification Officer</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="courseId">Course (Required)</label>
            <select
              id="courseId"
              name="courseId"
              value={formData.courseId}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/verification-admin')}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Officer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationOfficerCreation;