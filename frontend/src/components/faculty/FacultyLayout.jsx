// src/components/faculty/FacultyLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import FacultySidebar from "./FacultySidebar";
import Navbar from "../Navbar";
import "./FacultyLayout.css";

const FacultyLayout = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  //to debug
  console.log(localStorage.getItem("token"));
  console.log(localStorage.getItem("userId"));


  useEffect(() => {
    console.log("Checking token and userId...");
  
    if (!token || !userId) {
      console.log("Redirecting to login due to missing token or userId.");
      navigate("/login");
      return;
    }
  
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("User data fetched", res.data);
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch user data", err);
        navigate("/login");
      });
  }, [token, userId, navigate]);

  

  return (
    <>
     
      <div className="faculty-layout-container">
        <div className="faculty-layout-wrapper">
          <FacultySidebar />
          <div className="faculty-content">
            <Outlet context={{ user }} />
          </div>
        </div>
      </div>
    </>
  );
};


export default FacultyLayout;