import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { MdDarkMode, MdLightMode, MdOutlineVerified, MdOutlineCancel } from "react-icons/md";
import { FaSearch, FaUsers, FaBook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./VerificationAdminDashboard.css";

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const VerificationAdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [verificationOfficers, setVerificationOfficers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [allApplications, setAllApplications] = useState([]);
  const [courseApplications, setCourseApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("verification-theme") || "light";
  });
  const [batchSize, setBatchSize] = useState(2);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const navigate = useNavigate();

  // Toggle theme between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("verification-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }, [theme]);

  // Set initial theme on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Log token presence for debugging
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Current token:", token ? "Present" : "Missing");
  }, []);

  // Get authentication headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      return {};
    }
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  }, []);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/verification-admin/users`, getAuthHeaders());
      const studentData = res.data.filter((user) => user.role === "student");
      setStudents(studentData);
      setError(null);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(err.response?.data?.message || "Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/courses`, getAuthHeaders());
      setCourses(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.response?.data?.message || "Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch verification officers
  const fetchVerificationOfficers = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/verification-admin/verification-officers`,
        getAuthHeaders()
      );
      setVerificationOfficers(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching verification officers:", err);
      setError(
        err.response?.data?.message || "Failed to load verification officers. Please try again."
      );
    }
  }, [getAuthHeaders]);

  // Fetch all applications
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/verification-admin/applications`,
        getAuthHeaders()
      );
      console.log("Fetched applications:", res.data);
      setAllApplications(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err.response?.data?.message || "Failed to load applications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch course data and application stats
  const fetchCourseData = useCallback(
    async (courseId) => {
      if (!courseId || !/^[0-9a-fA-F]{24}$/.test(courseId)) {
        setError("Invalid course ID");
        return;
      }
      setLoading(true);
      setCourseApplications([]);
      try {
        const statsRes = await axios.get(
          `${API_BASE_URL}/verification-admin/courses/${courseId}/applications-count`,
          getAuthHeaders()
        );
        console.log("Application stats:", statsRes.data);

        const appRes = await axios.get(
          `${API_BASE_URL}/verification-admin/applications`,
          getAuthHeaders()
        );
        const courseApps = appRes.data.filter((app) => app.courseId?._id === courseId) || [];
        console.log("Course applications:", courseApps);
        setCourseApplications(courseApps);

        const selected = courses.find((course) => course._id === courseId);
        if (!selected) {
          setError("Selected course not found");
          return;
        }
        setSelectedCourse(selected);
        setError(null);
      } catch (err) {
        console.error("Error fetching course data:", err);
        setError(
          err.response?.data?.message || "Failed to load data for the selected course."
        );
      } finally {
        setLoading(false);
      }
    },
    [courses, getAuthHeaders]
  );

  // Handle batch assignment
  const handleBatchAssignment = useCallback(async () => {
    if (!selectedCourse || !/^[0-9a-fA-F]{24}$/.test(selectedCourse._id)) {
      setError("No valid course selected.");
      return;
    }
    setIsAssigning(true);
    setCourseApplications([]);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/verification-admin/courses/${selectedCourse._id}/assign-officers`,
        { batchSize },
        getAuthHeaders()
      );
      alert(res.data.message);
      await Promise.all([fetchCourseData(selectedCourse._id), fetchStudents(), fetchApplications()]);
      setError(null);
    } catch (err) {
      console.error("Error in batch assignment:", err);
      setError(
        err.response?.data?.message ||
        `Failed to assign officers: ${err.message}`
      );
    } finally {
      setIsAssigning(false);
    }
  }, [batchSize, selectedCourse, fetchCourseData, fetchStudents, fetchApplications, getAuthHeaders]);

  // Handle unassign all
  const handleUnassign = useCallback(async () => {
    if (!selectedCourse || !/^[0-9a-fA-F]{24}$/.test(selectedCourse._id)) {
      setError("No valid course selected.");
      return;
    }
    setIsUnassigning(true);
    setCourseApplications([]);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/verification-admin/courses/${selectedCourse._id}/unassign-officers`,
        {},
        getAuthHeaders()
      );
      alert(res.data.message);
      await Promise.all([fetchCourseData(selectedCourse._id), fetchStudents(), fetchApplications()]);
      setError(null);
    } catch (err) {
      console.error("Error in unassigning officers:", err);
      setError(
        err.response?.data?.message ||
        `Failed to unassign officers: ${err.message}`
      );
    } finally {
      setIsUnassigning(false);
    }
  }, [selectedCourse, fetchCourseData, fetchStudents, fetchApplications, getAuthHeaders]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchStudents(),
        fetchCourses(),
        fetchVerificationOfficers(),
        fetchApplications()
      ]);
    };
    fetchData();
  }, [fetchStudents, fetchCourses, fetchVerificationOfficers, fetchApplications]);

  // Calculate statistics
  const totalStudents = students.length;
  const totalApplications = allApplications.length;
  const verifiedApplications = allApplications.filter(
    (app) =>
      app.verified &&
      app.verifiedBy &&
      app.verifiedBy.name &&
      app.verifiedBy.role
  ).length;
  const unverifiedApplications = totalApplications - verifiedApplications;

  return (
    <div className="va-verification-dashboard">
      <button onClick={toggleTheme} className="va-theme-toggle">
        {theme === "light" ? <MdDarkMode /> : <MdLightMode />}
      </button>

      <header className="va-dashboard-header">
        <h1>Verification Admin Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="va-btn-assign"
            onClick={() => navigate('/VerificationOfficerCreation')}
            style={{ background: "var(--gradient-success)" }}
          >
            Create Verification Officer
          </button>
          <div className="va-search-bar">
            <FaSearch className="va-search-icon" />
            <input
              type="text"
              placeholder="Search courses by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {error && <div className="va-error-message">{error}</div>}
      {loading && (
        <div className="va-loading-spinner">
          <div />
        </div>
      )}

      <section className="va-statistics">
        <div className="va-stat-card">
          <div className="va-stat-icon total">
            <FaUsers />
          </div>
          <div>
            <h3>{totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="va-stat-card">
          <div className="va-stat-icon total">
            <FaBook />
          </div>
          <div>
            <h3>{totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>
        <div className="va-stat-card">
          <div className="va-stat-icon verified">
            <MdOutlineVerified />
          </div>
          <div>
            <h3>{verifiedApplications}</h3>
            <p>Verified Applications</p>
          </div>
        </div>
        <div className="va-stat-card">
          <div className="va-stat-icon pending">
            <MdOutlineCancel />
          </div>
          <div>
            <h3>{unverifiedApplications}</h3>
            <p>Unverified Applications</p>
          </div>
        </div>
      </section>

      {courses.length > 0 && (
        <section className="va-courses-section">
          <h2>Courses</h2>
          <ul>
            {courses
              .filter((course) =>
                course.title?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((course) => (
                <li
                  key={course._id}
                  onClick={() => fetchCourseData(course._id)}
                  className={selectedCourse?._id === course._id ? "active" : ""}
                >
                  {course.title || "Untitled Course"}
                </li>
              ))}
          </ul>
        </section>
      )}

      {selectedCourse && (
        <>
          <div className="va-batch-assign-container">
            <h2>Course: {selectedCourse.title || "Untitled"}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                type="number"
                min="1"
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="va-batch-input"
              />
              <button
                className="va-btn-assign"
                onClick={handleBatchAssignment}
                disabled={isAssigning || isUnassigning}
              >
                {isAssigning ? "Assigning..." : "Distribute Applications"}
              </button>
              <button
                className="va-btn-assign"
                onClick={handleUnassign}
                disabled={isAssigning || isUnassigning}
                style={{ background: "var(--gradient-danger)" }}
              >
                {isUnassigning ? "Unassigning..." : "Unassign All"}
              </button>
            </div>
          </div>

          {courseApplications.length === 0 && <p>No applications for this course.</p>}
          {courseApplications.length > 0 && (
            <section className="va-course-applications-section">
              <h3>Applications</h3>
              <div className="va-applications-list">
                {courseApplications.map((app) => {
                  const student = app.studentId || {};
                  const isVerifiedByOfficer =
                    app.verified &&
                    app.verifiedBy &&
                    app.verifiedBy.name &&
                    app.verifiedBy.role;
                  console.log("Application verification status:", {
                    appId: app._id,
                    verified: app.verified,
                    verifiedBy: app.verifiedBy,
                    isVerifiedByOfficer,
                  });
                  return (
                    <div key={app._id} className="va-application-row">
                      <div className="va-application-left">
                        <div className="va-student-info">
                          <h4>{student.name || "Unknown Student"}</h4>
                          <p>{student.email || "N/A"}</p>
                        </div>
                        <div className="va-status">
                          {isVerifiedByOfficer ? (
                            <span className="va-verified">
                              Verified by {app.verifiedBy.name} ({app.verifiedBy.role})
                            </span>
                          ) : (
                            <span className="va-unverified">Unverified</span>
                          )}
                        </div>
                      </div>
                      <div className="va-application-right">
                        <div className="va-assigned-info">
                          <h4>Assigned to:</h4>
                          <p>
                            {app.assignedOfficer ? (
                              <span className="va-assigned">
                                {app.assignedOfficer.name} ({app.assignedOfficer.role || "N/A"})
                              </span>
                            ) : (
                              <span className="va-unassigned">Unassigned</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default VerificationAdminDashboard;