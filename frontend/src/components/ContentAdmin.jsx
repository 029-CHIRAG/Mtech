import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const ContentAdmin = () => {
  const [courses, setCourses] = useState([]); // List of courses
  const [selectedCourse, setSelectedCourse] = useState(null); // Selected course
  const [fields, setFields] = useState([]); // Dynamic form fields
  const [educationFields, setEducationFields] = useState({
    tenth: false,
    twelth: false,
    ug: false,
    pg: false,
  }); // Education fields to include
  const [newSectionName, setNewSectionName] = useState(""); // Name of new section
  const [newField, setNewField] = useState({ name: "", type: "text", required: false }); // New field to add
  const [sections, setSections] = useState([]); // List of sections (predefined + new)
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Fetch logged-in user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      } catch (err) {
        console.error("Token decoding failed:", err);
        setUser(null);
      }
    }
  }, []);

  // Fetch courses when the page loads
  useEffect(() => {
    axios.get("/courses")
      .then(res => setCourses(res.data))
      .catch(err => console.error("Error fetching courses:", err));
  }, []);

  // Handle course selection
  const handleCourseSelect = (course) => {
    setSelectedCourse(course); // Store selected course (includes courseId)

    // Fetch existing form structure for this course
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/get-form-structure/${course._id}`)
      .then(res => {
        setFields(res.data.fields || []);
        setEducationFields(res.data.educationFields || {
          tenth: false,
          twelth: false,
          ug: false,
          pg: false,
        });
        setSections(res.data.sections || []);
      })
      .catch(() => {
        setFields([]);
        setEducationFields({
          tenth: false,
          twelth: false,
          ug: false,
          pg: false,
        });
        setSections([]);
      });
  };

  // Add a new field dynamically
  const addField = () => {
    setFields([...fields, { name: "", label: "", type: "text", required: false }]);
  };

  // Save form structure (fields, education preferences, and new sections)
  const saveForm = () => {
    if (!selectedCourse) {
      alert("Please select a course first!");
      return;
    }

    axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/save-form-structure`, {
      courseId: selectedCourse._id,
      fields,
      educationFields,
      sections,
    })
      .then(() => alert("Form saved successfully"))
      .catch(err => console.error("Error saving form:", err));
  };

  // Update course description
  const updateDescription = () => {
    const newDescription = prompt("Enter new course description:");
    if (!newDescription) return;

    axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/update-course/${selectedCourse._id}`, { description: newDescription })
      .then(() => {
        alert("Description updated successfully");
        setCourses(courses.map(course =>
          course._id === selectedCourse._id ? { ...course, description: newDescription } : course
        ));
      })
      .catch(err => console.error("Error updating description:", err));
  };

  // Update field properties
  const updateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  // Add a new section
  const addSection = () => {
    if (!newSectionName) {
      alert("Please enter a section name.");
      return;
    }
    setSections([...sections, { name: newSectionName, fields: [] }]);
    setNewSectionName("");
  };

  // Add a new field to a section
  const addFieldToSection = (sectionIndex) => {
    if (!newField.name) {
      alert("Please enter a field name.");
      return;
    }
    const updatedSections = [...sections];
    updatedSections[sectionIndex].fields.push(newField);
    setSections(updatedSections);
    setNewField({ name: "", type: "text", required: false });
  };

  return (
    <div>
      <h2>Content Admin Panel</h2>

      {/* Select Course Dropdown */}
      <select onChange={(e) => handleCourseSelect(courses[e.target.selectedIndex - 1])}>
        <option value="">Select a Course</option>
        {courses.map(course => (
          <option key={course._id} value={course._id}>{course.title}</option>
        ))}
      </select>

      {/* Show Course-Specific Actions */}
      {selectedCourse && user?.role === "content_admin" && (
        <div>
          <h3>{selectedCourse.title}</h3>
          <p>{selectedCourse.description}</p>

          <button onClick={updateDescription}>Update Description</button>
          <button onClick={() => navigate(`/content-admin/add-description/${selectedCourse._id}`)}>
            Add Description
          </button>
          <button onClick={addField}>Add Field</button>

          {/* Configure Education Section */}
          <h4>Select Education Fields to Include:</h4>
          <label>
            <input
              type="checkbox"
              checked={educationFields.tenth}
              onChange={(e) => setEducationFields({ ...educationFields, tenth: e.target.checked })}
            />
            10th Details
          </label>
          <label>
            <input
              type="checkbox"
              checked={educationFields.twelth}
              onChange={(e) => setEducationFields({ ...educationFields, twelth: e.target.checked })}
            />
            12th Details
          </label>
          <label>
            <input
              type="checkbox"
              checked={educationFields.ug}
              onChange={(e) => setEducationFields({ ...educationFields, ug: e.target.checked })}
            />
            UG Details
          </label>
          <label>
            <input
              type="checkbox"
              checked={educationFields.pg}
              onChange={(e) => setEducationFields({ ...educationFields, pg: e.target.checked })}
            />
            PG Details
          </label>

          {/* Add New Section */}
          <h4>Add New Section:</h4>
          <input
            type="text"
            placeholder="Section Name"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
          />
          <button onClick={addSection}>Add Section</button>

          {/* Add Fields to Sections */}
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h5>{section.name}</h5>
              <input
                type="text"
                placeholder="Field Name"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              />
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
              </select>
              <label>
                Required:
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                />
              </label>
              <button onClick={() => addFieldToSection(sectionIndex)}>Add Field</button>
            </div>
          ))}

          {/* Form Field Editor */}
          {fields.map((field, index) => (
            <div key={index}>
              <input
                type="text"
                placeholder="Field Name (e.g., fullName)"
                value={field.name}
                onChange={(e) => updateField(index, "name", e.target.value)}
              />
              <input
                type="text"
                placeholder="Field Label (e.g., Full Name)"
                value={field.label}
                onChange={(e) => updateField(index, "label", e.target.value)}
              />
              <select
                value={field.type}
                onChange={(e) => updateField(index, "type", e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="dropdown">Dropdown</option>
              </select>
              <label>
                Required:
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(index, "required", e.target.checked)}
                />
              </label>
            </div>
          ))}

          {/* Save Form Button */}
          <button onClick={saveForm}>Save Form</button>
        </div>
      )}
    </div>
  );
};

export default ContentAdmin;