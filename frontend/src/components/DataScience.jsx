import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./DataScience.css";

const DataScience = () => {
  const { id } = useParams(); // Getting course ID from URL (optional)
  const [course, setCourse] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/courses/1`) // Fetch course details
      .then(response => setCourse(response.data))
      .catch(error => console.error("Error fetching course details:", error));
  }, []);

  if (!course) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="course-container">
      {/* Course Introduction */}
      <div className="course-header">
        <h1 className="course-title">{course.title}</h1>
        <p className="course-details">{course.details}</p>
      </div>

      {/* Impact of Data Science & Machine Learning */}
      <div className="impact-section">
        <h2>How Data Science & Machine Learning Impact Daily Life</h2>
        <div className="impact-cards">
          <div className="impact-card">
            <h3>Healthcare</h3>
            <p>AI-powered diagnosis, medical predictions, and personalized treatments.</p>
          </div>
          <div className="impact-card">
            <h3>Finance</h3>
            <p>Fraud detection, algorithmic trading, and risk management.</p>
          </div>
          <div className="impact-card">
            <h3>E-commerce</h3>
            <p>Recommendation engines, chatbots, and customer sentiment analysis.</p>
          </div>
          <div className="impact-card">
            <h3>Transportation</h3>
            <p>Self-driving cars, route optimization, and traffic prediction.</p>
          </div>
        </div>
      </div>

      {/* Benefits for Jobs */}
      <div className="benefits-section">
        <h2>Benefits of Data Science & ML in Jobs</h2>
        <div className="benefit-cards">
          <div className="benefit-card">
            <h3>High Demand</h3>
            <p>Companies are actively hiring Data Scientists with competitive salaries.</p>
          </div>
          <div className="benefit-card">
            <h3>Career Growth</h3>
            <p>Opportunities in AI, Machine Learning, and Big Data Analytics.</p>
          </div>
          <div className="benefit-card">
            <h3>Diverse Domains</h3>
            <p>Work in healthcare, finance, retail, cybersecurity, and more.</p>
          </div>
          <div className="benefit-card">
            <h3>Remote Opportunities</h3>
            <p>Many Data Science jobs offer remote work flexibility.</p>
          </div>
        </div>
      </div>

      {/* Check Syllabus Button */}
      <div className="syllabus-section">
        <button className="syllabus-button">Check Syllabus</button>
      </div>
    </div>
  );
};

export default DataScience;
