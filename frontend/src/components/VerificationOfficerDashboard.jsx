import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck,
} from "react-icons/fa";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import "./VerificationOfficerDashboard.css";

// API Base URL
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const VerificationOfficerDashboard = () => {
  const [assignedApplications, setAssignedApplications] = useState([]);
  const [officerName, setOfficerName] = useState("Officer");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("verification-theme") || "light";
  });
  const [checkboxes, setCheckboxes] = useState({});
  const [fieldComments, setFieldComments] = useState({});
  const [comments, setComments] = useState("");
  const [verificationError, setVerificationError] = useState(null);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("verification-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found. Please log in.");
      return {};
    }
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchOfficerProfile = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/verification-officer/profile`,
        getAuthHeaders()
      );
      setOfficerName(res.data.name || "Officer");
    } catch (err) {
      console.error("Error fetching officer profile:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load officer profile. Using default name."
      );
    }
  };

  const fetchAssignedApplications = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/verification-officer/assigned-applications`,
        getAuthHeaders()
      );
      setAssignedApplications(res.data);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load assigned applications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyApplication = async (applicationId, verified) => {
    // Only validate checkboxes when verifying (not when unverifying)
    if (verified) {
      // Check if there are any checkboxes
      if (Object.keys(checkboxes).length === 0) {
        setVerificationError("Please open student details and check all required fields before verifying.");
        return;
      }
      
      // For verification, check if all checkboxes are checked
      const allChecked = Object.values(checkboxes).every((checked) => checked);
      if (!allChecked) {
        // Check if comments are provided for all unchecked fields
        const uncheckedFields = Object.keys(checkboxes).filter(
          (key) => !checkboxes[key]
        );
        const missingComments = uncheckedFields.filter(
          (key) => !fieldComments[key] || fieldComments[key].trim() === ""
        );
        if (missingComments.length > 0) {
          setVerificationError(
            `Please provide comments for the following unchecked fields: ${missingComments.join(", ")}`
          );
          return;
        }
      }
    }

    // Clear any previous error
    setVerificationError(null);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/verification-officer/verify-application/${applicationId}`,
        { verified, comments, fieldComments },
        getAuthHeaders()
      );
      updateApplicationState(applicationId, verified, comments, fieldComments);
      alert(res.data.message);
      setComments(""); // Reset comments after submission
      setFieldComments({}); // Reset field comments after submission
    } catch (err) {
      handleVerificationError(err);
    }
  };

  const saveComments = async (applicationId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/verification-officer/save-application-comments/${applicationId}`,
        { comments, fieldComments },
        getAuthHeaders()
      );
      updateApplicationState(applicationId, selectedStudent.application.verified, comments, fieldComments);
      alert(res.data.message);
      setComments(""); // Reset comments after submission
      setFieldComments({}); // Reset field comments after submission
    } catch (err) {
      console.error("Error saving comments:", err);
      setVerificationError(
        err.response?.data?.message ||
          "Failed to save comments. Please try again."
      );
    }
  };

  const updateApplicationState = (applicationId, verified, comments, fieldComments) => {
    setAssignedApplications((prev) =>
      prev.map((app) =>
        app._id === applicationId
          ? {
              ...app,
              verified,
              formData: {
                ...app.formData,
                verificationStatus: verified ? "verified" : "rejected",
                verificationComments: comments,
                fieldComments: fieldComments,
              },
              verifiedBy: verified ? { name: officerName, role: "verification_officer" } : null,
              studentId: { ...app.studentId, verified, verifiedBy: verified ? { name: officerName } : null },
            }
          : app
      )
    );
    if (selectedStudent?.application?._id === applicationId) {
      setSelectedStudent({
        ...selectedStudent,
        verified,
        application: {
          ...selectedStudent.application,
          verified,
          formData: {
            ...selectedStudent.application.formData,
            verificationStatus: verified ? "verified" : "rejected",
            verificationComments: comments,
            fieldComments: fieldComments,
          },
        },
        verifiedBy: verified ? { name: officerName } : null,
      });
      // Reset checkboxes after verification
      setCheckboxes({});
      setFieldComments({});
    }
  };

  const handleVerificationError = (err) => {
    console.error("Error updating application verification:", err);
    setVerificationError(
      err.response?.data?.message ||
        "Failed to update application verification. Please try again."
    );
  };

  const openStudentDetails = (student, application = null) => {
    setSelectedStudent({
      ...student,
      application: application
        ? {
            ...application,
            courseTitle: application.courseId?.title,
            formData: application.formData,
            educationDetails: application.educationDetails,
            payment: application.payment,
          }
        : null,
    });
    
    // Initialize checkboxes based on the application data
    const initialCheckboxes = {};
    const initialFieldComments = {};
    
    // Add personal details checkboxes
    initialCheckboxes.fullName = false;
    initialCheckboxes.email = false;
    initialCheckboxes.phoneNumber = false;
    initialCheckboxes.currentAddress = false;
    initialFieldComments.fullName = "";
    initialFieldComments.email = "";
    initialFieldComments.phoneNumber = "";
    initialFieldComments.currentAddress = "";
    
    // Add education details checkboxes if they exist
    if (application?.educationDetails) {
      if (application.educationDetails.tenth?.length > 0) {
        initialCheckboxes.tenth = false;
        initialFieldComments.tenth = "";
      }
      if (application.educationDetails.twelth?.length > 0) {
        initialCheckboxes.twelth = false;
        initialFieldComments.twelth = "";
      }
      if (application.educationDetails.graduation?.length > 0) {
        initialCheckboxes.graduation = false;
        initialFieldComments.graduation = "";
      }
      if (application.educationDetails.postgraduate?.length > 0) {
        initialCheckboxes.postgraduate = false;
        initialFieldComments.postgraduate = "";
      }
    }
    
    // Add document checkboxes if they exist
    if (application?.formData?.documents?.length > 0) {
      application.formData.documents.forEach((_, index) => {
        initialCheckboxes[`document_${index}`] = false;
        initialFieldComments[`document_${index}`] = "";
      });
    }
    
    // Add payment checkbox only if payment exists and status is completed
    if (application?.payment && application.payment.status === "completed") {
      initialCheckboxes.payment = false;
      initialFieldComments.payment = "";
    }
    
    // Load existing field comments from application
    if (application?.formData?.fieldComments) {
      Object.entries(application.formData.fieldComments).forEach(([key, value]) => {
        initialFieldComments[key] = value || "";
      });
    }
    
    setCheckboxes(initialCheckboxes);
    setFieldComments(initialFieldComments);
    setComments(application?.formData?.verificationComments || "");
    setError(null);
    setVerificationError(null);
  };

  const viewDocument = async (filename, originalName) => {
    if (!filename) {
      console.error("Filename is undefined for:", originalName);
      setError(`Cannot load document "${originalName}". Invalid filename.`);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/Uploads/applications/${filename}`,
        {
          ...getAuthHeaders(),
          responseType: "blob",
        }
      );

      const file = new Blob([response.data], { type: response.data.type });
      const fileURL = URL.createObjectURL(file);

      const newWindow = window.open(fileURL, "_blank");
      if (!newWindow) {
        setError("Failed to open document. Please allow pop-ups for this site.");
      }

      setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
    } catch (err) {
      console.error("Error fetching document:", err);
      setError(
        err.response?.data?.message ||
          `Failed to load document "${originalName}". Please try again.`
      );
    }
  };

  const formatRole = (role) => {
    if (!role) return "";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleCheckboxChange = (key) => {
    setCheckboxes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setVerificationError(null); // Clear error when checkboxes change
    // Clear comment for the field if it's checked
    if (!checkboxes[key]) {
      setFieldComments((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const handleFieldCommentChange = (key, value) => {
    setFieldComments((prev) => ({
      ...prev,
      [key]: value,
    }));
    setVerificationError(null); // Clear error when comments change
  };

  const handleCommentsChange = (e) => {
    setComments(e.target.value);
  };

  useEffect(() => {
    fetchOfficerProfile();
    fetchAssignedApplications();
  }, []);

  const totalAssigned = assignedApplications.length;
  const verifiedCount = assignedApplications.filter((app) => app.verified).length;
  const pendingCount = totalAssigned - verifiedCount;

  // Calculate progress for checkboxes
  const calculateCheckboxProgress = () => {
    if (Object.keys(checkboxes).length === 0) return 0;
    const checkedCount = Object.values(checkboxes).filter(Boolean).length;
    return (checkedCount / Object.keys(checkboxes).length) * 100;
  };

  const checkboxProgress = calculateCheckboxProgress();

  return (
    <div className="vo-verification-dashboard">
      <button onClick={toggleTheme} className="vo-theme-toggle">
        {theme === "light" ? <MdDarkMode /> : <MdLightMode />}
      </button>

      <header className="vo-dashboard-header">
        <div className="vo-header-left">
          <span className="vo-welcome-message">Welcome, {officerName}</span>
        </div>
        <h1 className="vo-dashboard-title">Verification Officer Dashboard</h1>
      </header>

      {error && <div className="vo-error-message">{error}</div>}
      {loading && (
        <div className="vo-loading-spinner">
          <div />
        </div>
      )}

      <section className="vo-statistics">
        <div className="vo-stat-card">
          <div className="vo-stat-icon total">
            <FaInfoCircle />
          </div>
          <div>
            <h3>{totalAssigned}</h3>
            <p>Assigned Applications</p>
          </div>
        </div>
        <div className="vo-stat-card">
          <div className="vo-stat-icon verified">
            <FaCheckCircle />
          </div>
          <div>
            <h3>{verifiedCount}</h3>
            <p>Verified Applications</p>
          </div>
        </div>
        <div className="vo-stat-card">
          <div className="vo-stat-icon pending">
            <FaTimesCircle />
          </div>
          <div>
            <h3>{pendingCount}</h3>
            <p>Pending Verification</p>
          </div>
        </div>
      </section>

      <section className="vo-assigned-applications-section">
        <h2>Your Assigned Applications</h2>
        {assignedApplications.length === 0 && !loading ? (
          <div className="vo-empty-state">
            <p>No applications have been assigned to you yet.</p>
          </div>
        ) : (
          <div className="vo-applications-list">
            {assignedApplications.map((app) => {
              const student = app.studentId || {};
              return (
                <div key={app._id} className={`vo-application-row ${app.verified ? 'verified' : 'unverified'}`}>
                  <div className="vo-application-left">
                    <div className="vo-student-info">
                      <h4>{student.name || "Unknown Student"}</h4>
                      <p>{student.email || "N/A"}</p>
                    </div>
                    <div className="vo-status">
                      {app.verified ? (
                        <span className="vo-verified">
                          Verified by {officerName} (Verification Officer)
                        </span>
                      ) : (
                        <span className="vo-unverified">Unverified</span>
                      )}
                    </div>
                  </div>
                  <div className="vo-application-right">
                    <div className="vo-course-info">
                      <h4>Course:</h4>
                      <p>{app.courseId?.title || "N/A"}</p>
                    </div>
                    <div className="vo-actions">
                      <button
                        className="vo-btn-details"
                        onClick={() => openStudentDetails(app.studentId, app)}
                      >
                        <FaInfoCircle /> View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedStudent && (
        <div className="vo-student-details-modal">
          <div className="vo-modal-content">
            <h2>Student Application Details</h2>
            
            {selectedStudent.application && !selectedStudent.application.verified && (
              <div className="vo-verification-progress">
                <div className="vo-progress-text">
                  Verification Progress: {Math.round(checkboxProgress)}%
                </div>
                <div className="vo-progress-bar">
                  <div 
                    className="vo-progress-fill" 
                    style={{ width: `${checkboxProgress}%` }}
                  ></div>
                </div>
                <div className="vo-checkbox-helper">
                  Please check all required fields or provide comments for unchecked fields to verify this application
                </div>
              </div>
            )}
            
            <div className="vo-student-details-grid">
              <div className="vo-details-section">
                <h3>Personal Details</h3>
                <p>
                  <strong>Full Name:</strong>{" "}
                  {selectedStudent.application?.formData?.fullName || "N/A"}
                  <input
                    type="checkbox"
                    checked={checkboxes.fullName || false}
                    onChange={() => handleCheckboxChange("fullName")}
                  />
                  {!checkboxes.fullName && (
                    <input
                      type="text"
                      placeholder="Comment on fullName"
                      value={fieldComments.fullName || ""}
                      onChange={(e) => handleFieldCommentChange("fullName", e.target.value)}
                      style={{
                        marginLeft: "10px",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: `1px solid var(--border-color)`,
                        width: "200px",
                      }}
                    />
                  )}
                </p>
                <p>
                  <strong>Aadhaar Number:</strong>{" "}
                  {selectedStudent.application?.formData?.aadhaarNumber || "N/A"}
                </p>
                <p>
                  <strong>Date of Birth:</strong>{" "}
                  {selectedStudent.application?.formData?.dob
                    ? new Date(selectedStudent.application.formData.dob).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Gender:</strong>{" "}
                  {selectedStudent.application?.formData?.gender || "N/A"}
                </p>
                <p>
                  <strong>Nationality:</strong>{" "}
                  {selectedStudent.application?.formData?.nationality || "N/A"}
                </p>
                <p>
                  <strong>Verification Status:</strong>{" "}
                  {selectedStudent.verified && selectedStudent.verifiedBy ? (
                    <span className="vo-status-verified">
                      <FaCheckCircle /> Verified by{" "}
                      {formatRole(selectedStudent.verifiedBy.role)}{" "}
                      {selectedStudent.verifiedBy.name}
                    </span>
                  ) : (
                    <span className="vo-status-unverified">
                      <FaTimesCircle /> Pending Verification
                    </span>
                  )}
                </p>
                {selectedStudent.registrationNumber && (
                  <p>
                    <strong>Registration Number:</strong>{" "}
                    {selectedStudent.registrationNumber}
                  </p>
                )}
              </div>

              {selectedStudent.application && (
                <div className="vo-details-section">
                  <h3>Contact Information</h3>
                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedStudent.application?.formData?.email || "N/A"}
                    <input
                      type="checkbox"
                      checked={checkboxes.email || false}
                      onChange={() => handleCheckboxChange("email")}
                    />
                    {!checkboxes.email && (
                      <input
                        type="text"
                        placeholder="Comment on email"
                        value={fieldComments.email || ""}
                        onChange={(e) => handleFieldCommentChange("email", e.target.value)}
                        style={{
                          marginLeft: "10px",
                          padding: "0.5rem",
                          borderRadius: "4px",
                          border: `1px solid var(--border-color)`,
                          width: "200px",
                        }}
                      />
                    )}
                  </p>
                  <p>
                    <strong>Alternate Email:</strong>{" "}
                    {selectedStudent.application?.formData?.alternateEmail || "N/A"}
                  </p>
                  <p>
                    <strong>Phone Number:</strong>{" "}
                    {selectedStudent.application?.formData?.phoneNumber || "N/A"}
                    <input
                      type="checkbox"
                      checked={checkboxes.phoneNumber || false}
                      onChange={() => handleCheckboxChange("phoneNumber")}
                    />
                    {!checkboxes.phoneNumber && (
                      <input
                        type="text"
                        placeholder="Comment on phoneNumber"
                        value={fieldComments.phoneNumber || ""}
                        onChange={(e) => handleFieldCommentChange("phoneNumber", e.target.value)}
                        style={{
                          marginLeft: "10px",
                          padding: "0.5rem",
                          borderRadius: "4px",
                          border: `1px solid var(--border-color)`,
                          width: "200px",
                        }}
                      />
                    )}
                  </p>
                  <p>
                    <strong>Current Address:</strong>{" "}
                    {selectedStudent.application?.formData?.currentAddress || "N/A"}
                    <input
                      type="checkbox"
                      checked={checkboxes.currentAddress || false}
                      onChange={() => handleCheckboxChange("currentAddress")}
                    />
                    {!checkboxes.currentAddress && (
                      <input
                        type="text"
                        placeholder="Comment on currentAddress"
                        value={fieldComments.currentAddress || ""}
                        onChange={(e) => handleFieldCommentChange("currentAddress", e.target.value)}
                        style={{
                          marginLeft: "10px",
                          padding: "0.5rem",
                          borderRadius: "4px",
                          border: `1px solid var(--border-color)`,
                          width: "200px",
                        }}
                      />
                    )}
                  </p>
                  <p>
                    <strong>Permanent Address:</strong>{" "}
                    {selectedStudent.application?.formData?.permanentAddress || "N/A"}
                  </p>
                  <p>
                    <strong>Emergency Contact:</strong>{" "}
                    {selectedStudent.application?.formData?.emergencyContact || "N/A"}
                  </p>
                </div>
              )}

              {selectedStudent.application && (
                <div className="vo-details-section">
                  <h3>Parent/Guardian Details</h3>
                  <p>
                    <strong>Father's Name:</strong>{" "}
                    {selectedStudent.application?.formData?.fathersName || "N/A"}
                  </p>
                  <p>
                    <strong>Father's Occupation:</strong>{" "}
                    {selectedStudent.application?.formData?.fathersOccupation || "N/A"}
                  </p>
                  <p>
                    <strong>Father's Contact:</strong>{" "}
                    {selectedStudent.application?.formData?.fathersContact || "N/A"}
                  </p>
                  <p>
                    <strong>Mother's Name:</strong>{" "}
                    {selectedStudent.application?.formData?.mothersName || "N/A"}
                  </p>
                  <p>
                    <strong>Mother's Occupation:</strong>{" "}
                    {selectedStudent.application?.formData?.mothersOccupation || "N/A"}
                  </p>
                  <p>
                    <strong>Mother's Contact:</strong>{" "}
                    {selectedStudent.application?.formData?.fothersContact || "N/A"}
                  </p>
                </div>
              )}

              {selectedStudent.application && (
                <div className="vo-details-section">
                  <h3>Application Information</h3>
                  <p>
                    <strong>Course Applied:</strong>{" "}
                    {selectedStudent.application.courseTitle || "N/A"}
                  </p>
                  <p>
                    <strong>Program Type:</strong>{" "}
                    {selectedStudent.application.programType || "N/A"}
                  </p>
                  <p>
                    <strong>Applied On:</strong>{" "}
                    {selectedStudent.application.createdAt
                      ? new Date(selectedStudent.application.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Verification Status:</strong>{" "}
                    {selectedStudent.application.formData?.verificationStatus || "Pending"}
                  </p>
                  {selectedStudent.application.formData?.verificationComments && (
                    <p>
                      <strong>Verification Comments:</strong>{" "}
                      {selectedStudent.application.formData.verificationComments}
                    </p>
                  )}
                </div>
              )}

              {selectedStudent.application && (
                <div className="vo-details-section">
                  <h3>Payment Details</h3>
                  {selectedStudent.application.payment ? (
                    <div className="vo-statement-box">
                      <p>
                        <strong>Amount:</strong> ₹{selectedStudent.application.payment.amount || "N/A"}
                      </p>
                      <p>
                        <strong>Payment Method:</strong>{" "}
                        {selectedStudent.application.payment.paymentMethod || "N/A"}
                      </p>
                      <p>
                        <strong>Payment Date:</strong>{" "}
                        {selectedStudent.application.payment.paymentDate
                          ? new Date(selectedStudent.application.payment.paymentDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {selectedStudent.application.payment.status || "N/A"}
                        {selectedStudent.application.payment.status === "completed" ? (
                          <>
                            <input
                              type="checkbox"
                              checked={checkboxes.payment || false}
                              onChange={() => handleCheckboxChange("payment")}
                            />
                            {!checkboxes.payment && (
                              <input
                                type="text"
                                placeholder="Comment on payment"
                                value={fieldComments.payment || ""}
                                onChange={(e) => handleFieldCommentChange("payment", e.target.value)}
                                style={{
                                  marginLeft: "10px",
                                  padding: "0.5rem",
                                  borderRadius: "4px",
                                  border: `1px solid var(--border-color)`,
                                  width: "200px",
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <span style={{ marginLeft: "10px", color: "var(--danger-color)" }}>
                            (Verification blocked: Payment not completed)
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="vo-error-message">
                      No payment found. Verification is blocked until payment is completed.
                    </div>
                  )}
                </div>
              )}

              {selectedStudent.application?.educationDetails && (
                <div className="vo-details-section">
                  <h3>Academic Details</h3>
                  {["tenth", "twelth", "graduation", "postgraduate"].map(
                    (level) =>
                      selectedStudent.application.educationDetails[level]?.length > 0 && (
                        <div key={level}>
                          <h4>
                            {level === "tenth"
                              ? "10th"
                              : level === "twelth"
                              ? "12th"
                              : level.charAt(0).toUpperCase() + level.slice(1)}
                            <input
                              type="checkbox"
                              checked={checkboxes[level] || false}
                              onChange={() => handleCheckboxChange(level)}
                            />
                            {!checkboxes[level] && (
                              <input
                                type="text"
                                placeholder={`Comment on ${level}`}
                                value={fieldComments[level] || ""}
                                onChange={(e) => handleFieldCommentChange(level, e.target.value)}
                                style={{
                                  marginLeft: "10px",
                                  padding: "0.5rem",
                                  borderRadius: "4px",
                                  border: `1px solid var(--border-color)`,
                                  width: "200px",
                                }}
                              />
                            )}
                          </h4>
                          {selectedStudent.application.educationDetails[level].map(
                            (entry, index) => (
                              <div key={index} className="vo-statement-box">
                                {level === "tenth" || level === "twelth" ? (
                                  <>
                                    <p>
                                      <strong>School Name:</strong>{" "}
                                      {entry.schoolName || "N/A"}
                                    </p>
                                    <p>
                                      <strong>Board:</strong>{" "}
                                      {entry.board || "N/A"}
                                    </p>
                                    <p>
                                      <strong>Year of Passing:</strong>{" "}
                                      {entry.yearOfPassing || entry.year || "N/A"}
                                    </p>
                                    <p>
                                      <strong>Percentage:</strong>{" "}
                                      {entry.percentage || "N/A"}
                                    </p>
                                    <p>
                                      <strong>Subjects:</strong>{" "}
                                      {entry.subjects || "N/A"}
                                    </p>
                                    {level === "twelth" && (
                                      <p>
                                        <strong>Stream:</strong>{" "}
                                        {entry.stream || "N/A"}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p>
                                      <strong>College Name:</strong>{" "}
                                      {entry.collegeName || "N/A"}
                                    </p>
                                    <p>
                                      <strong>Degree:</strong>{" "}
                                      {entry.degree || "N/A"}
                                    </p>
                                    <p>
                                      <strong>Branch:</strong>{" "}
                                      {entry.branch || "N/A"}
                                    </p>
                                    <p>
                                      <strong>University:</strong>{" "}
                                      {entry.university || "N/A"}
                                    </p>
                                    <p>
                                      <strong>Year of Passing:</strong>{" "}
                                      {entry.yearOfPassing || entry.year || "N/A"}
                                    </p>
                                    <p>
                                      <strong>CGPA:</strong>{" "}
                                      {entry.percentage || entry.cgpa || "N/A"}
                                    </p>
                                  </>
                                )}
                                {/* Render custom fields if any */}
                                {Object.keys(entry)
                                  .filter(
                                    (key) =>
                                      ![
                                        "schoolName",
                                        "board",
                                        "yearOfPassing",
                                        "year",
                                        "percentage",
                                        "subjects",
                                        "stream",
                                        "collegeName",
                                        "degree",
                                        "branch",
                                        "university",
                                        "cgpa",
                                      ].includes(key)
                                  )
                                  .map((customKey) => (
                                    <p key={customKey}>
                                      <strong>
                                        {customKey
                                          .replace(/([A-Z])/g, " $1")
                                          .replace(/^./, (str) => str.toUpperCase())}:
                                      </strong>{" "}
                                      {entry[customKey] || "N/A"}
                                    </p>
                                  ))}
                              </div>
                            )
                          )}
                        </div>
                      )
                  )}
                </div>
              )}

              {selectedStudent.application?.formData?.documents?.length > 0 && (
                <div className="vo-details-section">
                  <h3>Uploaded Documents</h3>
                  <ul>
                    {selectedStudent.application.formData.documents.map(
                      (doc, index) => (
                        <li key={index}>
                          <strong>{doc.type}:</strong>{" "}
                          {doc.filename ? (
                            <span
                              className="vo-document-link"
                              onClick={() =>
                                viewDocument(doc.filename, doc.originalName)
                              }
                            >
                              {doc.originalName}
                            </span>
                          ) : (
                            <span>{doc.originalName} (Invalid filename)</span>
                          )}
                          <input
                            type="checkbox"
                            checked={checkboxes[`document_${index}`] || false}
                            onChange={() => handleCheckboxChange(`document_${index}`)}
                          />
                          {!checkboxes[`document_${index}`] && (
                            <input
                              type="text"
                              placeholder={`Comment on document ${doc.type}`}
                              value={fieldComments[`document_${index}`] || ""}
                              onChange={(e) => handleFieldCommentChange(`document_${index}`, e.target.value)}
                              style={{
                                marginLeft: "10px",
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: `1px solid var(--border-color)`,
                                width: "200px",
                              }}
                            />
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
            {selectedStudent.application && (
              <div className="vo-details-section">
                <h3>Verification Comments</h3>
                <textarea
                  value={comments}
                  onChange={handleCommentsChange}
                  placeholder="Enter general verification/unverification comments (optional)"
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: "6px",
                    border: `1px solid var(--border-color)`,
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    resize: "vertical",
                  }}
                />
              </div>
            )}
            <div className="vo-modal-actions">
              {selectedStudent.application && (
                <>
                  <button
                    className={
                      selectedStudent.application.verified
                        ? "vo-btn-unverify"
                        : "vo-btn-verify"
                    }
                    onClick={() =>
                      verifyApplication(
                        selectedStudent.application._id,
                        !selectedStudent.application.verified
                      )
                    }
                  >
                    <FaUserCheck />{" "}
                    {selectedStudent.application.verified ? "Unverify" : "Verify"} Application
                  </button>
                  <button
                    className="vo-btn-details"
                    onClick={() => saveComments(selectedStudent.application._id)}
                  >
                    <FaInfoCircle /> Send Comments
                  </button>
                  {verificationError && (
                    <div className="vo-error-message" style={{ margin: "0 1rem", alignSelf: "center" }}>
                      {verificationError}
                    </div>
                  )}
                </>
              )}
              <button
                className="vo-btn-close"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationOfficerDashboard;