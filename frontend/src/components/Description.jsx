import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FiBook, FiTarget, FiAward, FiClock, FiList, FiCheckCircle } from "react-icons/fi";
import "./Description.css";

const Description = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}`)
      .then((response) => setCourse(response.data))
      .catch((err) => console.error("Error fetching course description:", err));
  }, [courseId]);

  // Slideshow effect
  useEffect(() => {
    if (course && (course.image1 || course.image2)) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % 2);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [course]);

  if (!course) {
    return (
      <div className="desc-premium-container">
        <div className="desc-header">
          <div className="desc-title">Loading Course...</div>
        </div>
      </div>
    );
  }

  const hasImages = course.image1 || course.image2;
  const images = [course.image1, course.image2].filter(Boolean);

  return (
    <div className="desc-premium-container">
      <div className="desc-header">
        <h1 className="desc-title">{course.title}</h1>
        <p className="desc-description">
          {course.programDescription || "No description available."}
        </p>
      </div>

      {/* Premium Slideshow */}
      <div className="desc-premium-slideshow">
        {hasImages ? (
          <>
            {images.map((image, index) => (
              <div
                key={index}
                className={`desc-premium-slide ${
                  currentSlide === index ? 'active' : currentSlide === (index + 1) % images.length ? 'next' : ''
                }`}
              >
                <img src={image} alt={`Course ${index + 1}`} className="desc-slide-image" />
              </div>
            ))}
            <div className="desc-slide-nav">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`desc-slide-dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="desc-premium-slide active">
            <div className="desc-slide-placeholder">
              <FiBook size={60} color="#4361ee" />
              <p>No images available</p>
            </div>
          </div>
        )}
      </div>

      {/* Vision Card */}
      <h3 className="desc-section-title">Our Vision</h3>
      <div className="desc-card">
        <h4><FiTarget /> Vision Statement</h4>
        <p>{course.vision || "No vision statement available."}</p>
      </div>

      {/* Mission Card */}
      <h3 className="desc-section-title">Our Mission</h3>
      <div className="desc-card">
        <h4><FiAward /> Mission Statement</h4>
        <p>{course.mission || "No mission statement available."}</p>
      </div>

      {/* Years Card */}
      <h3 className="desc-section-title">Department History</h3>
      <div className="desc-card">
        <h4><FiClock /> Years of Excellence</h4>
        <p>{course.yearsOfDepartment ? `${course.yearsOfDepartment} years of academic excellence` : "Not specified."}</p>
      </div>

      {/* Syllabus */}
      <h3 className="desc-section-title">Curriculum</h3>
      {course.syllabus && course.syllabus.length > 0 ? (
        course.syllabus.map((semester, index) => (
          <div key={index} className="desc-card">
            <h4><FiList /> {semester.semester}</h4>
            <ul className="desc-syllabus-list">
              {semester.subjects.map((subject, subjectIndex) => (
                <li key={subjectIndex}>{subject}</li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <div className="desc-card">
          <p>No syllabus available.</p>
        </div>
      )}

      {/* PEOs */}
      <h3 className="desc-section-title">Program Educational Objectives</h3>
      {course.programEducationalObjectives && course.programEducationalObjectives.length > 0 ? (
        <div className="desc-card">
          <h4><FiCheckCircle /> PEOs</h4>
          <ul className="desc-peos-list">
            {course.programEducationalObjectives.map((peo, index) => (
              <li key={index}>{peo}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="desc-card">
          <p>No PEOs available.</p>
        </div>
      )}

      {/* POs */}
      <h3 className="desc-section-title">Program Outcomes</h3>
      {course.programOutcomes && course.programOutcomes.length > 0 ? (
        <div className="desc-card">
          <h4><FiCheckCircle /> POs</h4>
          <ul className="desc-pos-list">
            {course.programOutcomes.map((po, index) => (
              <li key={index}>{po}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="desc-card">
          <p>No POs available.</p>
        </div>
      )}

      <Link to={`/application/${courseId}`} className="desc-premium-btn">
        Apply Now
      </Link>
    </div>
  );
};

export default Description;