import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // To get courseId from URL
import ApplicationForm from "./ApplicationForm";

const StudentApplication = () => {
  const { courseId } = useParams(); // Get courseId from route params
  const [formFields, setFormFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormStructure = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/get-form/${courseId}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        setFormFields(data.fields);
      } catch (err) {
        setError("Failed to load form. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFormStructure();
  }, [courseId]);

  if (loading) return <p>Loading form...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Student Application Form</h2>
      <ApplicationForm formFields={formFields} courseId={courseId} />
    </div>
  );
};

export default StudentApplication;
