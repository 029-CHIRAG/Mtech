import React from "react";
import { FaUserGraduate } from "react-icons/fa";
import "./StudentManagementWelcome.css";

const StudentManagementWelcome = () => {
  return (
    <div className="student-welcome-container">
      <div className="student-welcome-icon">
        <FaUserGraduate />
      </div>
      <h2>Student Dashboard Management</h2>
      <p>Please select a student from the list on the left to update their dashboard information.</p>
      <div className="student-welcome-tips">
        <h3>Tips:</h3>
        <ul>
          <li>You can search for students by name or email</li>
          <li>Click on a student to edit their dashboard information</li>
          <li>All changes are saved immediately to the student's profile</li>
          <li>You can update courses, GPA, assignments, and more</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentManagementWelcome;