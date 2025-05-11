// StudentsManagement.js
import React, { useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import StudentList from "./StudentList";
import "./StudentsManagement.css";

const StudentsManagement = () => {
  const sidebarRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const container = containerRef.current;

    let isResizing = false;

    const handleMouseDown = (e) => {
      if (e.target.classList.contains("resize-handle")) {
        isResizing = true;
        document.body.style.cursor = "col-resize";
      }
    };

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const offsetLeft = container.getBoundingClientRect().left;
      const newWidth = e.clientX - offsetLeft;

      if (newWidth >= 240 && newWidth <= 600) {
        sidebar.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.body.style.cursor = "default";
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="students-management-container" ref={containerRef}>
      <div className="students-sidebar" ref={sidebarRef}>
        <StudentList />
        <div className="resize-handle" />
      </div>
      <div className="students-content">
        <Outlet />
      </div>
    </div>
  );
};

export default StudentsManagement;