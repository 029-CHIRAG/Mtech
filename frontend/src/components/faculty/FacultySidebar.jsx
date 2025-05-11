// src/components/faculty/FacultySidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import "./FacultySidebar.css";

const FacultySidebar = () => {
  return (
    <div className="faculty-sidebar">
      <h2>Faculty Panel</h2>
      <ul>
        <li>
          <NavLink
            to="/faculty"
            end
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/faculty/edit-dashboard"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            Edit Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/faculty/update-student"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            Update Student
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default FacultySidebar;