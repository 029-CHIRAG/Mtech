import React, { useState, useEffect } from "react";
import "./ApplicationForm.css";
import axios from "axios";
import { useParams } from "react-router-dom";

const ApplicationForm = () => {
  const { courseId } = useParams();
  const sections = [
    "Personal Details",
    "Contact Information",
    "Parent/Guardian Details",
    "Academic Details",
    "Documents Upload",
    "Declaration",
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    nationality: "",
    aadhaarNumber: "",
    phoneNumber: "",
    email: "",
    alternateEmail: "",
    currentAddress: "",
    permanentAddress: "",
    emergencyContact: "",
    fathersName: "",
    mothersName: "",
    fathersOccupation: "",
    mothersOccupation: "",
    fathersContact: "",
    mothersContact: "",
    documents: [],
    agreement: false,
  });

  const [previousFormData, setPreviousFormData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    nationality: "",
    aadhaarNumber: "",
    phoneNumber: "",
    email: "",
    alternateEmail: "",
    currentAddress: "",
    permanentAddress: "",
    emergencyContact: "",
    fathersName: "",
    mothersName: "",
    fathersOccupation: "",
    mothersOccupation: "",
    fathersContact: "",
    mothersContact: "",
    documents: [],
    agreement: false,
    educationDetails: { tenth: [], twelth: [], graduation: [], postgraduate: [] },
  });

  const [educationDetails, setEducationDetails] = useState({
    tenth: [],
    twelth: [],
    graduation: [],
    postgraduate: [],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState({});
  const [savedSections, setSavedSections] = useState({}); // Track saved sections
  const [openAccordion, setOpenAccordion] = useState(null);
  const [errors, setErrors] = useState({});
  const [popupMessage, setPopupMessage] = useState({ message: "", type: "" });
  const [selectedDocument, setSelectedDocument] = useState("");
  const [formStructure, setFormStructure] = useState({
    programType: "PG",
    requiredAcademicFields: [],
    requiredAcademicSubfields: {
      tenth: { percentage: false, yearOfPassing: false, board: false, schoolName: false, customFields: [] },
      twelth: { percentage: false, yearOfPassing: false, board: false, schoolName: false, customFields: [] },
      graduation: { percentage: false, yearOfPassing: false, university: false, collegeName: false, customFields: [] },
      postgraduate: { percentage: false, yearOfPassing: false, university: false, collegeName: false, customFields: [] },
    },
    requiredDocuments: [],
  });
  const [isViewMode, setIsViewMode] = useState(false); // Control view mode
  const [editSection, setEditSection] = useState(null); // Track section being edited

  const showPopup = (message, type = "success") => {
    setPopupMessage({ message, type });
    setTimeout(() => setPopupMessage({ message: "", type: "" }), 4000);
  };

  useEffect(() => {
    const fetchFormStructure = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/forms/get-form-structure/${courseId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setFormStructure({
          programType: response.data.programType || "PG",
          requiredAcademicFields: response.data.requiredAcademicFields || [],
          requiredAcademicSubfields: response.data.requiredAcademicSubfields || {
            tenth: { percentage: false, yearOfPassing: false, board: false, schoolName: false, customFields: [] },
            twelth: { percentage: false, yearOfPassing: false, board: false, schoolName: false, customFields: [] },
            graduation: { percentage: false, yearOfPassing: false, university: false, collegeName: false, customFields: [] },
            postgraduate: { percentage: false, yearOfPassing: false, university: false, collegeName: false, customFields: [] },
          },
          requiredDocuments: response.data.requiredDocuments || [],
        });
      } catch (error) {
        console.error("Error fetching form structure:", error);
        showPopup("Error fetching form structure. Defaulting to PG.", "error");
      }
    };

    const fetchDraftApplication = async () => {
      try {
        const token = localStorage.getItem("token");
        const studentId = localStorage.getItem("userId");
        if (!token || !studentId) {
          showPopup("Please log in to continue.", "error");
          return;
        }
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/applications/get-application/${studentId}/${courseId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data && response.data.status === "draft") {
          setFormData(response.data.formData);
          setEducationDetails(response.data.educationDetails);
          setActiveIndex(response.data.lastActiveSection || 0);
          setCompletedSections(
            sections.reduce((acc, _, idx) => {
              if (idx < response.data.lastActiveSection) acc[idx] = true;
              return acc;
            }, {})
          );
          setSavedSections(
            sections.reduce((acc, _, idx) => {
              if (idx <= response.data.lastActiveSection) acc[idx] = true;
              return acc;
            }, {})
          );
          showPopup("Resumed your saved application.", "success");
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error fetching draft application:", error);
          showPopup("Error loading saved application.", "error");
        }
      }
    };

    if (courseId) {
      fetchFormStructure();
      fetchDraftApplication();
    }
  }, [courseId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const studentId = localStorage.getItem("userId");
      if (!token || !studentId) {
        showPopup("Please log in to save the application.", "error");
        return;
      }

      const submissionData = new FormData();
      submissionData.append("courseId", courseId);
      submissionData.append("studentId", studentId);
      submissionData.append("formData", JSON.stringify({ ...formData }));
      submissionData.append("educationDetails", JSON.stringify(educationDetails));
      submissionData.append("programType", formStructure.programType);
      submissionData.append("lastActiveSection", activeIndex);

      formData.documents.forEach((doc) => {
        if (doc.file) {
          submissionData.append("documents", doc.file);
        }
      });

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/applications/save-draft`,
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSavedSections((prev) => ({ ...prev, [activeIndex]: true }));
      showPopup(response.data.message, "success");
    } catch (error) {
      console.error("Error saving draft:", error);
      let errorMessage = error.response?.data?.message || `Failed to save draft: ${error.message}`;
      if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        localStorage.removeItem("token");
      }
      showPopup(errorMessage, "error");
    }
  };

  const handleSubmit = async () => {
    if (validateSection()) {
      if (!formData.aadhaarNumber || !/^\d{12}$/.test(formData.aadhaarNumber)) {
        setErrors((prev) => ({
          ...prev,
          aadhaarNumber: "Valid 12-digit Aadhaar number is required",
        }));
        showPopup("Please enter a valid Aadhaar number.", "error");
        return;
      }
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        setErrors((prev) => ({
          ...prev,
          email: "Valid email is required",
        }));
        showPopup("Please enter a valid email address.", "error");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          showPopup("Please log in to submit the application.", "error");
          return;
        }
        if (!token.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)) {
          showPopup("Invalid token format. Please log in again.", "error");
          localStorage.removeItem("token");
          return;
        }
        console.log("Token (redacted):", token.slice(0, 10) + "...");

        const studentId = localStorage.getItem("userId");
        if (!studentId) {
          showPopup("User ID not found. Please log in again.", "error");
          return;
        }

        const validDocuments = formData.documents.filter(doc => doc.type && doc.file && doc.file instanceof File && doc.file.size > 0);
        if (validDocuments.length === 0) {
          showPopup("Please upload at least one valid document file.", "error");
          return;
        }
        if (validDocuments.length !== formStructure.requiredDocuments.length) {
          showPopup(`Please upload exactly ${formStructure.requiredDocuments.length} required documents.`, "error");
          return;
        }

        const submissionData = new FormData();
        submissionData.append("courseId", courseId);
        submissionData.append("studentId", studentId);
        submissionData.append("formData", JSON.stringify({
          ...formData,
          documents: validDocuments.map(doc => ({ type: doc.type })),
        }));
        submissionData.append("educationDetails", JSON.stringify(educationDetails));
        submissionData.append("programType", formStructure.programType);

        validDocuments.forEach((doc) => {
          submissionData.append("documents", doc.file);
        });

        console.log("Submitting FormData:");
        for (let [key, value] of submissionData.entries()) {
          console.log(`${key}:`, value);
        }

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/applications/submit-application`,
          submissionData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setPreviousFormData({ ...formData, educationDetails });
        showPopup("Form saved successfully", "success"); // Consistent success message
      } catch (error) {
        console.error("Error submitting application:", error);
        let errorMessage = error.response?.data?.message || error.response?.data?.error || `Failed to submit application: ${error.message}`;
        if (error.response?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          localStorage.removeItem("token");
        }
        showPopup(errorMessage, "error");
      }
    } else {
      showPopup("Please fix the errors in the form before submitting.", "error");
    }
  };

  const handleSectionClick = (index) => {
    if (index <= activeIndex || completedSections[index - 1] || completedSections[index]) {
      setActiveIndex(index);
      setIsViewMode(false);
      setEditSection(null);
    } else {
      showPopup("Please complete the previous sections first.", "error");
    }
  };

  const validateSection = () => {
    const sectionErrors = {};
    switch (activeIndex) {
      case 0:
        if (!formData.fullName) sectionErrors.fullName = "Full name is required";
        if (!formData.dob) sectionErrors.dob = "Date of birth is required";
        if (!formData.gender) sectionErrors.gender = "Gender is required";
        if (!formData.nationality) sectionErrors.nationality = "Nationality is required";
        if (!formData.aadhaarNumber || !/^\d{12}$/.test(formData.aadhaarNumber))
          sectionErrors.aadhaarNumber = "Valid 12-digit Aadhaar number is required";
        break;
      case 1:
        if (!formData.phoneNumber || !/^((\+91|0)?[0-9]{10})$/.test(formData.phoneNumber.replace(/\s/g, "")))
          sectionErrors.phoneNumber = "Valid 10-digit phone number is required";
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
          sectionErrors.email = "Valid email is required";
        if (formData.alternateEmail && !/\S+@\S+\.\S+/.test(formData.alternateEmail))
          sectionErrors.alternateEmail = "Valid alternate email is required";
        if (!formData.currentAddress) sectionErrors.currentAddress = "Current address is required";
        if (!formData.permanentAddress) sectionErrors.permanentAddress = "Permanent address is required";
        if (!formData.emergencyContact || !/^((\+91|0)?[0-9]{10})$/.test(formData.emergencyContact.replace(/\s/g, "")))
          sectionErrors.emergencyContact = "Valid 10-digit emergency contact is required";
        break;
      case 2:
        if (!formData.fathersName) sectionErrors.fathersName = "Father's name is required";
        if (!formData.mothersName) sectionErrors.mothersName = "Mother's name is required";
        if (!formData.fathersOccupation) sectionErrors.fathersOccupation = "Father's occupation is required";
        if (!formData.mothersOccupation) sectionErrors.mothersOccupation = "Mother's occupation is required";
        if (!formData.fathersContact || !/^((\+91|0)?[0-9]{10})$/.test(formData.fathersContact.replace(/\s/g, "")))
          sectionErrors.fathersContact = "Valid 10-digit father's contact is required";
        if (!formData.mothersContact || !/^((\+91|0)?[0-9]{10})$/.test(formData.mothersContact.replace(/\s/g, "")))
          sectionErrors.mothersContact = "Valid 10-digit mother's contact is required";
        break;
      case 3:
        const academicErrors = [];
        formStructure.requiredAcademicFields.forEach((level) => {
          if (educationDetails[level].length === 0) {
            academicErrors.push(`Please provide details for ${level.charAt(0).toUpperCase() + level.slice(1)}.`);
          }
          educationDetails[level].forEach((entry, index) => {
            const subfields = formStructure.requiredAcademicSubfields[level];
            if (subfields.schoolName && !entry.schoolName) {
              sectionErrors[`school${level === "tenth" ? "10" : "12"}_${index}`] = "School name is required";
            }
            if (subfields.board && !entry.board) {
              sectionErrors[`board${level === "tenth" ? "10" : "12"}_${index}`] = "Board is required";
            }
            if (subfields.percentage && (!entry.percentage || isNaN(entry.percentage) || entry.percentage > 100)) {
              sectionErrors[`percentage${level === "tenth" ? "10" : "12"}_${index}`] = "Valid percentage is required";
            }
            if (level === "twelth" && subfields.stream && !entry.stream) {
              sectionErrors[`stream12_${index}`] = "Stream is required";
            }
            if (subfields.subjects && !entry.subjects) {
              sectionErrors[`subjects${level === "tenth" ? "10" : "12"}_${index}`] = "Subjects are required";
            }
            if (level === "graduation" || level === "postgraduate") {
              if (subfields.collegeName && !entry.collegeName) {
                sectionErrors[`college${level === "graduation" ? "Grad" : "PG"}_${index}`] = "College name is required";
              }
              if (subfields.university && !entry.university) {
                sectionErrors[`university${level === "graduation" ? "Grad" : "PG"}_${index}`] = "University is required";
              }
              if (subfields.percentage && (!entry.percentage || isNaN(entry.percentage) || entry.percentage > 10)) {
                sectionErrors[`percentage${level === "graduation" ? "Grad" : "PG"}_${index}`] = "Valid CGPA is required";
              }
              if (subfields.degree && !entry.degree) {
                sectionErrors[`degree${level === "graduation" ? "Grad" : "PG"}_${index}`] = "Degree is required";
              }
              if (subfields.branch && !entry.branch) {
                sectionErrors[`branch${level === "graduation" ? "Grad" : "PG"}_${index}`] = "Branch is required";
              }
            }
            subfields.customFields.forEach((field) => {
              if (field.required && !entry[field.name]) {
                sectionErrors[`${field.name}_${level}_${index}`] = `${field.label} is required`;
              }
            });
          });
        });
        if (academicErrors.length > 0) sectionErrors.academicDetails = academicErrors;
        break;
      case 4:
        const docTypes = formData.documents.map((doc) => doc.type);
        formStructure.requiredDocuments.forEach((doc) => {
          if (!docTypes.includes(doc)) {
            sectionErrors.documents = sectionErrors.documents
              ? `${sectionErrors.documents}, ${doc} is required`
              : `${doc} is required`;
          }
        });
        if (formData.documents.length !== formStructure.requiredDocuments.length) {
          sectionErrors.documents = sectionErrors.documents
            ? `${sectionErrors.documents}, Exactly ${formStructure.requiredDocuments.length} documents must be uploaded`
            : `Exactly ${formStructure.requiredDocuments.length} documents must be uploaded`;
        }
        formData.documents.forEach((doc, index) => {
          if (!doc.file) sectionErrors[`document_${index}`] = `File for ${doc.type} is required`;
        });
        break;
      case 5:
        if (!formData.agreement) sectionErrors.agreement = "You must agree to the terms and conditions";
        break;
      default:
        break;
    }

    setErrors(sectionErrors);
    return Object.keys(sectionErrors).length === 0;
  };

  const handleNext = async () => {
    if (activeIndex === 0) {
      if (!formData.aadhaarNumber || !/^\d{12}$/.test(formData.aadhaarNumber)) {
        setErrors((prev) => ({
          ...prev,
          aadhaarNumber: "Valid 12-digit Aadhaar number is required",
        }));
        showPopup("Please enter a valid Aadhaar number.", "error");
        return;
      }
    } else if (activeIndex === 1) {
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        setErrors((prev) => ({
          ...prev,
          email: "Valid email is required",
        }));
        showPopup("Please enter a valid email address.", "error");
        return;
      }
    }

    if (validateSection()) {
      setCompletedSections((prev) => ({ ...prev, [activeIndex]: true }));
      if (!savedSections[activeIndex]) {
        await handleSave();
      }
      if (activeIndex < sections.length - 1) {
        setActiveIndex(activeIndex + 1);
      }
    } else {
      showPopup("Please fix the errors in the form before proceeding.", "error");
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      setIsViewMode(false);
      setEditSection(null);
    }
  };

  const toggleAccordion = (section, e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenAccordion(openAccordion === section ? null : section);
  };

  const handleInputChange = (e, level, index) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === "year") {
      sanitizedValue = value.trim();
      if (sanitizedValue && !/^\d{0,4}$/.test(sanitizedValue)) {
        return;
      }
    }
    const updatedDetails = educationDetails[level].map((entry, i) => {
      if (i === index) {
        return { ...entry, [name]: sanitizedValue };
      }
      return entry;
    });
    setEducationDetails({ ...educationDetails, [level]: updatedDetails });
    if (sanitizedValue) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${name}${level === "tenth" ? "10" : level === "twelth" ? "12" : level === "graduation" ? "Grad" : "PG"}_${index}`];
        return newErrors;
      });
    }
  };

  const handlePhoneInputChange = (e, field) => {
    let value = e.target.value.replace(/\s/g, "");
    setFormData({ ...formData, [field]: value });
  };

  const handleAddEducation = (level) => {
    if (educationDetails[level].length > 0) {
      return;
    }
    const newEntry =
      level === "graduation" || level === "postgraduate"
        ? {
            collegeName: "",
            degree: "",
            branch: "",
            university: "",
            year: "",
            percentage: "",
          }
        : {
            schoolName: "",
            board: "",
            year: "",
            percentage: "",
            subjects: "",
            ...(level === "twelth" && { stream: "" }),
          };
    formStructure.requiredAcademicSubfields[level].customFields.forEach((field) => {
      newEntry[field.name] = "";
    });
    setEducationDetails({
      ...educationDetails,
      [level]: [...educationDetails[level], newEntry],
    });
    setOpenAccordion(level);
  };

  const handleRemoveEducation = (level, index) => {
    const updatedDetails = educationDetails[level].filter((_, i) => i !== index);
    setEducationDetails({ ...educationDetails, [level]: updatedDetails });
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.includes(`${level}_${index}`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const handleSaveEducation = (level, index) => {
    const sectionErrors = {};
    const entry = educationDetails[level][index];
    const subfields = formStructure.requiredAcademicSubfields[level];

    if (level === "tenth" || level === "twelth") {
      if (subfields.schoolName && !entry.schoolName) {
        sectionErrors[`school${level === "tenth" ? "10" : "12"}_${index}`] = "School name is required";
      }
      if (subfields.board && !entry.board) {
        sectionErrors[`board${level === "tenth" ? "10" : "12"}_${index}`] = "Board is required";
      }
      if (subfields.percentage && (!entry.percentage || isNaN(entry.percentage) || entry.percentage > 100)) {
        sectionErrors[`percentage${level === "tenth" ? "10" : "12"}_${index}`] = "Valid percentage is required";
      }
      if (level === "twelth" && subfields.stream && !entry.stream) {
        sectionErrors[`stream12_${index}`] = "Stream is required";
      }
      if (subfields.subjects && !entry.subjects) {
        sectionErrors[`subjects${level === "tenth" ? "10" : "12"}_${index}`] = "Subjects are required";
      }
    } else if (level === "graduation" || level === "postgraduate") {
      if (subfields.collegeName && !entry.collegeName) {
        sectionErrors[`college${level === "graduation" ? "Grad" : "PG"}_${index}`] = "College name is required";
      }
      if (subfields.university && !entry.university) {
        sectionErrors[`university${level === "graduation" ? "Grad" : "PG"}_${index}`] = "University is required";
      }
      if (subfields.percentage && (!entry.percentage || isNaN(entry.percentage) || entry.percentage > 10)) {
        sectionErrors[`percentage${level === "graduation" ? "Grad" : "PG"}_${index}`] = "Valid CGPA is required";
      }
      if (subfields.degree && !entry.degree) {
        sectionErrors[`degree${level === "graduation" ? "Grad" : "PG"}_${index}`] = "Degree is required";
      }
      if (subfields.branch && !entry.branch) {
        sectionErrors[`branch${level === "graduation" ? "Grad" : "PG"}_${index}`] = "Branch is required";
      }
    }
    subfields.customFields.forEach((field) => {
      if (field.required && !entry[field.name]) {
        sectionErrors[`${field.name}_${level}_${index}`] = `${field.label} is required`;
      }
    });

    setErrors((prev) => ({ ...prev, ...sectionErrors }));

    if (Object.keys(sectionErrors).length === 0) {
      const nextLevel = formStructure.requiredAcademicFields[formStructure.requiredAcademicFields.indexOf(level) + 1] || null;
      setOpenAccordion(nextLevel);
    }
  };

  const handleAddDocument = () => {
    if (selectedDocument && formData.documents.length < formStructure.requiredDocuments.length) {
      const isDuplicate = formData.documents.some((doc) => doc.type === selectedDocument);
      if (!isDuplicate && formStructure.requiredDocuments.includes(selectedDocument)) {
        setFormData({
          ...formData,
          documents: [...formData.documents, { type: selectedDocument, file: null }],
        });
        setSelectedDocument("");
      }
    }
  };

  const handleRemoveDocument = (index) => {
    const updatedDocuments = formData.documents.filter((_, i) => i !== index);
    setFormData({ ...formData, documents: updatedDocuments });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`document_${index}`];
      return newErrors;
    });
  };

  const handleDocumentFileChange = (index, file) => {
    if (!file) {
      showPopup(`No file selected for ${formData.documents[index].type}.`, "error");
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const isImageType = ['Image (Passport Photo)', 'Signature'].includes(formData.documents[index].type);
    if ((isImageType && !file.type.startsWith('image/')) || (!isImageType && !allowedTypes.includes(file.type))) {
      showPopup(`Invalid file type for ${formData.documents[index].type}. Use JPEG, PNG, or PDF.`, "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showPopup(`File size for ${formData.documents[index].type} exceeds 5MB.`, "error");
      return;
    }
    const updatedDocuments = formData.documents.map((doc, i) =>
      i === index ? { ...doc, file } : doc
    );
    setFormData({ ...formData, documents: updatedDocuments });
    showPopup(`File selected for ${formData.documents[index].type}: ${file.name}`, "success");
  };

  const handleViewForm = () => {
    setIsViewMode(true);
  };

  const handleEditSection = (index) => {
    setEditSection(index);
    setActiveIndex(index);
    setIsViewMode(false);
  };

  const handleCloseView = () => {
    setIsViewMode(false);
    setEditSection(null);
    setActiveIndex(sections.length - 1);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeIndex, isViewMode]);

  const renderSubfieldInput = (level, subfield, entry, index) => {
    const subfields = formStructure.requiredAcademicSubfields[level];
    const isRequired = subfields[subfield] || (subfield === "stream" && level === "twelth" && subfields.stream);
    if (!isRequired) return null;

    const fieldProps = {
      name: subfield,
      value: entry[subfield] || "",
      onChange: (e) => handleInputChange(e, level, index),
      required: isRequired,
    };

    switch (subfield) {
      case "stream":
        return (
          <>
            <label>Stream:</label>
            <select {...fieldProps}>
              <option value="">Select Stream</option>
              <option value="Science">Science</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts</option>
            </select>
            {errors[`stream12_${index}`] && <span className="error">{errors[`stream12_${index}`]}</span>}
          </>
        );
      case "subjects":
        return (
          <>
            <label>Subjects:</label>
            <textarea
              {...fieldProps}
              placeholder="Enter subjects (e.g., Math, Science)"
              list={`subjects${level}_${index}Suggestions`}
            />
            <datalist id={`subjects${level}_${index}Suggestions`}>
              {previousFormData.educationDetails[level][index]?.subjects && (
                <option value={previousFormData.educationDetails[level][index].subjects} />
              )}
            </datalist>
            {errors[`subjects${level === "tenth" ? "10" : "12"}_${index}`] && (
              <span className="error">{errors[`subjects${level === "tenth" ? "10" : "12"}_${index}`]}</span>
            )}
          </>
        );
      case "percentage":
        return (
          <>
            <label>{(level === "graduation" || level === "postgraduate") ? "CGPA" : "Percentage"}:</label>
            <input
              type="number"
              {...fieldProps}
              placeholder={`Enter ${(level === "graduation" || level === "postgraduate") ? "CGPA" : "percentage"}`}
              list={`percentage${level}_${index}Suggestions`}
            />
            <datalist id={`percentage${level}_${index}Suggestions`}>
              {previousFormData.educationDetails[level][index]?.percentage && (
                <option value={previousFormData.educationDetails[level][index].percentage} />
              )}
            </datalist>
            {errors[`percentage${level === "tenth" ? "10" : level === "twelth" ? "12" : level === "graduation" ? "Grad" : "PG"}_${index}`] && (
              <span className="error">{errors[`percentage${level === "tenth" ? "10" : level === "twelth" ? "12" : level === "graduation" ? "Grad" : "PG"}_${index}`]}</span>
            )}
          </>
        );
      case "yearOfPassing":
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 1900; year <= currentYear; year++) {
          years.push(year);
        }
        return (
          <>
            <label>Year of Passing:</label>
            <select {...fieldProps} list={`year${level}_${index}Suggestions`}>
              <option value="">Select Year</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <datalist id={`year${level}_${index}Suggestions`}>
              {previousFormData.educationDetails[level][index]?.year && (
                <option value={previousFormData.educationDetails[level][index].year} />
              )}
            </datalist>
            {errors[`year${level === "tenth" ? "10" : level === "twelth" ? "12" : level === "graduation" ? "Grad" : "PG"}_${index}`] && (
              <span className="error">{errors[`year${level === "tenth" ? "10" : level === "twelth" ? "12" : level === "graduation" ? "Grad" : "PG"}_${index}`]}</span>
            )}
          </>
        );
      default:
        return (
          <>
            <label>{subfield.charAt(0).toUpperCase() + subfield.slice(1).replace(/([A-Z])/g, ' $1')}:</label>
            <input
              type={subfield === "schoolName" ? "text" : subfield === "board" ? "text" : subfield === "university" ? "text" : subfield === "collegeName" ? "text" : "text"}
              {...fieldProps}
              placeholder={`Enter ${subfield}`}
              list={`${subfield}${level}_${index}Suggestions`}
            />
            <datalist id={`${subfield}${level}_${index}Suggestions`}>
              {previousFormData.educationDetails[level][index]?.[subfield] && (
                <option value={previousFormData.educationDetails[level][index][subfield]} />
              )}
            </datalist>
            {errors[`${subfield}${level === "tenth" ? "10" : level === "twelth" ? "12" : level === "graduation" ? "Grad" : "PG"}_${index}`] && (
              <span className="error">{errors[`${subfield}${level === "tenth" ? "10" : level === "twelth" ? "12" : level === "graduation" ? "Grad" : "PG"}_${index}`]}</span>
            )}
          </>
        );
    }
  };

  const renderCustomFieldInput = (level, field, entry, index) => {
    if (!field.required) return null;
    const fieldProps = {
      name: field.name,
      value: entry[field.name] || "",
      onChange: (e) => handleInputChange(e, level, index),
      required: field.required,
    };

    switch (field.type) {
      case "dropdown":
        return (
          <>
            <label>{field.label}:</label>
            <select {...fieldProps}>
              <option value="">Select {field.label}</option>
              {field.options && Array.isArray(field.options) ? (
                field.options.map((option, idx) => (
                  <option key={idx} value={option}>{option}</option>
                ))
              ) : (
                <option value="" disabled>No options available</option>
              )}
            </select>
            {errors[`${field.name}_${level}_${index}`] && (
              <span className="error">{errors[`${field.name}_${level}_${index}`]}</span>
            )}
          </>
        );
      case "date":
        return (
          <>
            <label>{field.label}:</label>
            <input type="date" {...fieldProps} placeholder={`Enter ${field.label}`} />
            {errors[`${field.name}_${level}_${index}`] && (
              <span className="error">{errors[`${field.name}_${level}_${index}`]}</span>
            )}
          </>
        );
      case "number":
        return (
          <>
            <label>{field.label}:</label>
            <input type="number" {...fieldProps} placeholder={`Enter ${field.label}`} />
            {errors[`${field.name}_${level}_${index}`] && (
              <span className="error">{errors[`${field.name}_${level}_${index}`]}</span>
            )}
          </>
        );
      default:
        return (
          <>
            <label>{field.label}:</label>
            <input type="text" {...fieldProps} placeholder={`Enter ${field.label}`} />
            {errors[`${field.name}_${level}_${index}`] && (
              <span className="error">{errors[`${field.name}_${level}_${index}`]}</span>
            )}
          </>
        );
    }
  };

  const renderViewMode = () => (
    <div className="view-modal">
      <div className="view-content">
        <h2>Review Your Application</h2>
        {sections.map((section, index) => (
          <div key={section} className="view-section">
            <h3>{section}</h3>
            {index === 0 && (
              <div className="personal-details">
                <p><strong>Full Name:</strong> {formData.fullName || "N/A"}</p>
                <p><strong>Date of Birth:</strong> {formData.dob || "N/A"}</p>
                <p><strong>Gender:</strong> {formData.gender || "N/A"}</p>
                <p><strong>Nationality:</strong> {formData.nationality || "N/A"}</p>
                <p><strong>Aadhaar Number:</strong> {formData.aadhaarNumber || "N/A"}</p>
              </div>
            )}
            {index === 1 && (
              <div className="contact-information">
                <p><strong>Phone Number:</strong> {formData.phoneNumber || "N/A"}</p>
                <p><strong>Email:</strong> {formData.email || "N/A"}</p>
                <p><strong>Alternate Email:</strong> {formData.alternateEmail || "N/A"}</p>
                <p><strong>Current Address:</strong> {formData.currentAddress || "N/A"}</p>
                <p><strong>Permanent Address:</strong> {formData.permanentAddress || "N/A"}</p>
                <p><strong>Emergency Contact:</strong> {formData.emergencyContact || "N/A"}</p>
              </div>
            )}
            {index === 2 && (
              <div className="parent-details">
                <p><strong>Father's Name:</strong> {formData.fathersName || "N/A"}</p>
                <p><strong>Mother's Name:</strong> {formData.mothersName || "N/A"}</p>
                <p><strong>Father's Occupation:</strong> {formData.fathersOccupation || "N/A"}</p>
                <p><strong>Mother's Occupation:</strong> {formData.mothersOccupation || "N/A"}</p>
                <p><strong>Father's Contact:</strong> {formData.fathersContact || "N/A"}</p>
                <p><strong>Mother's Contact:</strong> {formData.mothersContact || "N/A"}</p>
              </div>
            )}
            {index === 3 && (
              <div className="academic-details">
                {formStructure.requiredAcademicFields.map((level) => (
                  <div key={level}>
                    <h4>{level === "tenth" ? "10th" : level === "twelth" ? "12th" : level.charAt(0).toUpperCase() + level.slice(1)} Details</h4>
                    {educationDetails[level].map((entry, idx) => (
                      <div key={idx}>
                        {(level === "tenth" || level === "twelth") && (
                          <>
                            <p><strong>School Name:</strong> {entry.schoolName || "N/A"}</p>
                            <p><strong>Board:</strong> {entry.board || "N/A"}</p>
                            <p><strong>Year of Passing:</strong> {entry.year || "N/A"}</p>
                            <p><strong>Percentage:</strong> {entry.percentage || "N/A"}</p>
                            <p><strong>Subjects:</strong> {entry.subjects || "N/A"}</p>
                            {level === "twelth" && <p><strong>Stream:</strong> {entry.stream || "N/A"}</p>}
                          </>
                        )}
                        {(level === "graduation" || level === "postgraduate") && (
                          <>
                            <p><strong>College Name:</strong> {entry.collegeName || "N/A"}</p>
                            <p><strong>Degree:</strong> {entry.degree || "N/A"}</p>
                            <p><strong>Branch:</strong> {entry.branch || "N/A"}</p>
                            <p><strong>University:</strong> {entry.university || "N/A"}</p>
                            <p><strong>Year of Passing:</strong> {entry.year || "N/A"}</p>
                            <p><strong>CGPA:</strong> {entry.percentage || "N/A"}</p>
                          </>
                        )}
                        {formStructure.requiredAcademicSubfields[level].customFields.map((field) => (
                          <p key={field.name}><strong>{field.label}:</strong> {entry[field.name] || "N/A"}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {index === 4 && (
              <div className="document-upload">
                {formData.documents.map((doc, idx) => (
                  <p key={idx}><strong>{doc.type}:</strong> {doc.file ? doc.file.name : "No file uploaded"}</p>
                ))}
              </div>
            )}
            {index === 5 && (
              <div className="declaration">
                <p><strong>Agreement:</strong> {formData.agreement ? "Agreed" : "Not Agreed"}</p>
              </div>
            )}
            <button
              type="button"
              className="edit-btn"
              onClick={() => handleEditSection(index)}
            >
              Edit {section}
            </button>
          </div>
        ))}
        <div className="view-navigation">
          <button type="button" className="back-btn" onClick={handleCloseView}>
            Back to Form
          </button>
          <button type="button" className="submit-btn" onClick={handleSubmit}>
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="full-page-container">
        <div className="sidebar">
          <h3>Student Registration</h3>
          <ul>
            {sections.map((section, index) => (
              <li
                key={section}
                className={activeIndex === index ? "active" : completedSections[index] ? "completed" : ""}
                onClick={() => handleSectionClick(index)}
              >
                {section} {completedSections[index] && <span className="tick">✔</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className="form-container">
          {popupMessage.message && (
            <div className={`popup-message ${popupMessage.type}`}>
              <span className="popup-icon">
                {popupMessage.type === "success" ? "✔" : "✖"}
              </span>
              {popupMessage.message}
            </div>
          )}
          {isViewMode ? (
            renderViewMode()
          ) : (
            <>
              <h2>{sections[activeIndex]}</h2>
              <form>
                {activeIndex === 0 && (
                  <div className="personal-details">
                    <label>Full Name:</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      list="fullNameSuggestions"
                      title={previousFormData.fullName ? `Previous: ${previousFormData.fullName}` : ""}
                      required
                    />
                    <datalist id="fullNameSuggestions">
                      {previousFormData.fullName && <option value={previousFormData.fullName} />}
                    </datalist>
                    {errors.fullName && <span className="error">{errors.fullName}</span>}

                    <label>Date of Birth:</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      title={previousFormData.dob ? `Previous: ${previousFormData.dob}` : ""}
                      required
                    />
                    {errors.dob && <span className="error">{errors.dob}</span>}

                    <label>Gender:</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      title={previousFormData.gender ? `Previous: ${previousFormData.gender}` : ""}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <span className="error">{errors.gender}</span>}

                    <label>Nationality:</label>
                    <input
                      type="text"
                      placeholder="Enter your nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      list="nationalitySuggestions"
                      title={previousFormData.nationality ? `Previous: ${previousFormData.nationality}` : ""}
                      required
                    />
                    <datalist id="nationalitySuggestions">
                      {previousFormData.nationality && <option value={previousFormData.nationality} />}
                    </datalist>
                    {errors.nationality && <span className="error">{errors.nationality}</span>}

                    <label>Aadhaar Number:</label>
                    <input
                      type="text"
                      placeholder="Enter Aadhaar Number"
                      value={formData.aadhaarNumber}
                      onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                      list="aadhaarNumberSuggestions"
                      title={previousFormData.aadhaarNumber ? `Previous: ${previousFormData.aadhaarNumber}` : ""}
                      required
                    />
                    <datalist id="aadhaarNumberSuggestions">
                      {previousFormData.aadhaarNumber && <option value={previousFormData.aadhaarNumber} />}
                    </datalist>
                    {errors.aadhaarNumber && <span className="error">{errors.aadhaarNumber}</span>}
                  </div>
                )}

                {activeIndex === 1 && (
                  <div className="contact-information">
                    <label>Phone Number:</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number (e.g., +91XXXXXXXXXX or 0XXXXXXXXXX)"
                      value={formData.phoneNumber}
                      onChange={(e) => handlePhoneInputChange(e, "phoneNumber")}
                      list="phoneNumberSuggestions"
                      title={previousFormData.phoneNumber ? `Previous: ${previousFormData.phoneNumber}` : ""}
                      required
                    />
                    <datalist id="phoneNumberSuggestions">
                      {previousFormData.phoneNumber && <option value={previousFormData.phoneNumber} />}
                    </datalist>
                    {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}

                    <label>Email Address:</label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      list="emailSuggestions"
                      title={previousFormData.email ? `Previous: ${previousFormData.email}` : ""}
                      required
                    />
                    <datalist id="emailSuggestions">
                      {previousFormData.email && <option value={previousFormData.email} />}
                    </datalist>
                    {errors.email && <span className="error">{errors.email}</span>}

                    <label>Alternate Email Address (Optional):</label>
                    <input
                      type="email"
                      placeholder="Enter alternate email address"
                      value={formData.alternateEmail}
                      onChange={(e) => setFormData({ ...formData, alternateEmail: e.target.value })}
                      list="alternateEmailSuggestions"
                      title={previousFormData.alternateEmail ? `Previous: ${previousFormData.alternateEmail}` : ""}
                    />
                    <datalist id="alternateEmailSuggestions">
                      {previousFormData.alternateEmail && <option value={previousFormData.alternateEmail} />}
                    </datalist>
                    {errors.alternateEmail && <span className="error">{errors.alternateEmail}</span>}

                    <label>Current Address:</label>
                    <textarea
                      placeholder="Enter your current address"
                      value={formData.currentAddress}
                      onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                      list="currentAddressSuggestions"
                      title={previousFormData.currentAddress ? `Previous: ${previousFormData.currentAddress}` : ""}
                      required
                    />
                    <datalist id="currentAddressSuggestions">
                      {previousFormData.currentAddress && <option value={previousFormData.currentAddress} />}
                    </datalist>
                    {errors.currentAddress && <span className="error">{errors.currentAddress}</span>}

                    <label>Permanent Address:</label>
                    <textarea
                      placeholder="Enter your permanent address"
                      value={formData.permanentAddress}
                      onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                      list="permanentAddressSuggestions"
                      title={previousFormData.permanentAddress ? `Previous: ${previousFormData.permanentAddress}` : ""}
                      required
                    />
                    <datalist id="permanentAddressSuggestions">
                      {previousFormData.permanentAddress && <option value={previousFormData.permanentAddress} />}
                    </datalist>
                    {errors.permanentAddress && <span className="error">{errors.permanentAddress}</span>}

                    <label>Emergency Contact Number:</label>
                    <input
                      type="tel"
                      placeholder="Enter emergency contact (e.g., +91XXXXXXXXXX or 0XXXXXXXXXX)"
                      value={formData.emergencyContact}
                      onChange={(e) => handlePhoneInputChange(e, "emergencyContact")}
                      list="emergencyContactSuggestions"
                      title={previousFormData.emergencyContact ? `Previous: ${previousFormData.emergencyContact}` : ""}
                      required
                    />
                    <datalist id="emergencyContactSuggestions">
                      {previousFormData.emergencyContact && <option value={previousFormData.emergencyContact} />}
                    </datalist>
                    {errors.emergencyContact && <span className="error">{errors.emergencyContact}</span>}
                  </div>
                )}

                {activeIndex === 2 && (
                  <div className="parent-details">
                    <label>Father's Name:</label>
                    <input
                      type="text"
                      placeholder="Enter father's name"
                      value={formData.fathersName}
                      onChange={(e) => setFormData({ ...formData, fathersName: e.target.value })}
                      list="fathersNameSuggestions"
                      title={previousFormData.fathersName ? `Previous: ${previousFormData.fathersName}` : ""}
                      required
                    />
                    <datalist id="fathersNameSuggestions">
                      {previousFormData.fathersName && <option value={previousFormData.fathersName} />}
                    </datalist>
                    {errors.fathersName && <span className="error">{errors.fathersName}</span>}

                    <label>Mother's Name:</label>
                    <input
                      type="text"
                      placeholder="Enter mother's name"
                      value={formData.mothersName}
                      onChange={(e) => setFormData({ ...formData, mothersName: e.target.value })}
                      list="mothersNameSuggestions"
                      title={previousFormData.mothersName ? `Previous: ${previousFormData.mothersName}` : ""}
                      required
                    />
                    <datalist id="mothersNameSuggestions">
                      {previousFormData.mothersName && <option value={previousFormData.mothersName} />}
                    </datalist>
                    {errors.mothersName && <span className="error">{errors.mothersName}</span>}

                    <label>Father's Occupation:</label>
                    <input
                      type="text"
                      placeholder="Enter father's occupation"
                      value={formData.fathersOccupation}
                      onChange={(e) => setFormData({ ...formData, fathersOccupation: e.target.value })}
                      list="fathersOccupationSuggestions"
                      title={previousFormData.fathersOccupation ? `Previous: ${previousFormData.fathersOccupation}` : ""}
                      required
                    />
                    <datalist id="fathersOccupationSuggestions">
                      {previousFormData.fathersOccupation && <option value={previousFormData.fathersOccupation} />}
                    </datalist>
                    {errors.fathersOccupation && <span className="error">{errors.fathersOccupation}</span>}

                    <label>Mother's Occupation:</label>
                    <input
                      type="text"
                      placeholder="Enter mother's occupation"
                      value={formData.mothersOccupation}
                      onChange={(e) => setFormData({ ...formData, mothersOccupation: e.target.value })}
                      list="mothersOccupationSuggestions"
                      title={previousFormData.mothersOccupation ? `Previous: ${previousFormData.mothersOccupation}` : ""}
                      required
                    />
                    <datalist id="mothersOccupationSuggestions">
                      {previousFormData.mothersOccupation && <option value={previousFormData.mothersOccupation} />}
                    </datalist>
                    {errors.mothersOccupation && <span className="error">{errors.mothersOccupation}</span>}

                    <label>Father's Contact Number:</label>
                    <input
                      type="tel"
                      placeholder="Enter father's contact (e.g., +91XXXXXXXXXX or 0XXXXXXXXXX)"
                      value={formData.fathersContact}
                      onChange={(e) => handlePhoneInputChange(e, "fathersContact")}
                      list="fathersContactSuggestions"
                      title={previousFormData.fathersContact ? `Previous: ${previousFormData.fathersContact}` : ""}
                      required
                    />
                    <datalist id="fathersContactSuggestions">
                      {previousFormData.fathersContact && <option value={previousFormData.fathersContact} />}
                    </datalist>
                    {errors.fathersContact && <span className="error">{errors.fathersContact}</span>}

                    <label>Mother's Contact Number:</label>
                    <input
                      type="tel"
                      placeholder="Enter mother's contact (e.g., +91XXXXXXXXXX or 0XXXXXXXXXX)"
                      value={formData.mothersContact}
                      onChange={(e) => handlePhoneInputChange(e, "mothersContact")}
                      list="mothersContactSuggestions"
                      title={previousFormData.mothersContact ? `Previous: ${previousFormData.mothersContact}` : ""}
                      required
                    />
                    <datalist id="mothersContactSuggestions">
                      {previousFormData.mothersContact && <option value={previousFormData.mothersContact} />}
                    </datalist>
                    {errors.mothersContact && <span className="error">{errors.mothersContact}</span>}
                  </div>
                )}

                {activeIndex === 3 && (
                  <div className="academic-details">
                    {formStructure.requiredAcademicFields.map((level, idx) => (
                      <div key={idx} className="accordion-section">
                        <button
                          className="accordion"
                          onClick={(e) => toggleAccordion(level, e)}
                        >
                          {level === "tenth" ? "10th" : level === "twelth" ? "12th" : level.charAt(0).toUpperCase() + level.slice(1)} Details
                          <span>{openAccordion === level ? "▲" : "▼"}</span>
                        </button>
                        {openAccordion === level && (
                          <div className="panel">
                            {educationDetails[level].map((entry, index) => (
                              <div key={index} className="academic-information">
                                {(level === "tenth" || level === "twelth") && (
                                  <>
                                    {renderSubfieldInput(level, "schoolName", entry, index)}
                                    {renderSubfieldInput(level, "board", entry, index)}
                                    {renderSubfieldInput(level, "yearOfPassing", entry, index)}
                                    {renderSubfieldInput(level, "percentage", entry, index)}
                                    {renderSubfieldInput(level, "subjects", entry, index)}
                                    {level === "twelth" && renderSubfieldInput(level, "stream", entry, index)}
                                  </>
                                )}
                                {(level === "graduation" || level === "postgraduate") && (
                                  <>
                                    {renderSubfieldInput(level, "collegeName", entry, index)}
                                    {renderSubfieldInput(level, "degree", entry, index)}
                                    {renderSubfieldInput(level, "branch", entry, index)}
                                    {renderSubfieldInput(level, "university", entry, index)}
                                    {renderSubfieldInput(level, "yearOfPassing", entry, index)}
                                    {renderSubfieldInput(level, "percentage", entry, index)}
                                  </>
                                )}
                                {formStructure.requiredAcademicSubfields[level].customFields.map((field) =>
                                  renderCustomFieldInput(level, field, entry, index)
                                )}
                                <div className="button-group">
                                  <button
                                    type="button"
                                    className="remove-btn"
                                    onClick={() => handleRemoveEducation(level, index)}
                                  >
                                    Remove
                                  </button>
                                  <button
                                    type="button"
                                    className="save-btn"
                                    onClick={() => handleSaveEducation(level, index)}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="add-btn"
                              onClick={() => handleAddEducation(level)}
                              disabled={educationDetails[level].length > 0}
                            >
                              Add {level === "tenth" ? "10th" : level === "twelth" ? "12th" : level.charAt(0).toUpperCase() + level.slice(1)} Details
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {errors.academicDetails && (
                      <ul className="error">
                        {errors.academicDetails.map((error, index) => (
                          <li key={`academic-error-${index}`}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {activeIndex === 4 && (
                  <div className="document-upload">
                    <label>Select Document Type:</label>
                    <div className="document-selector">
                      <select
                        value={selectedDocument}
                        onChange={(e) => setSelectedDocument(e.target.value)}
                      >
                        <option value="">Select a document</option>
                        {formStructure.requiredDocuments.map((doc) => (
                          <option
                            key={doc}
                            value={doc}
                            disabled={formData.documents.some((d) => d.type === doc)}
                          >
                            {doc}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="add-btn"
                        onClick={handleAddDocument}
                        disabled={!selectedDocument || formData.documents.length >= formStructure.requiredDocuments.length}
                      >
                        Add Document
                      </button>
                    </div>
                    {errors.documents && <span className="error">{errors.documents}</span>}

                    <div className="document-list">
                      {formData.documents.map((doc, index) => (
                        <div key={index} className="document-row">
                          <span>{doc.type}</span>
                          <input
                            type="file"
                            accept={doc.type === "Image (Passport Photo)" || doc.type === "Signature" ? "image/*" : "*"}
                            onChange={(e) => handleDocumentFileChange(index, e.target.files[0])}
                          />
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => handleRemoveDocument(index)}
                          >
                            Remove
                          </button>
                          {errors[`document_${index}`] && (
                            <span className="error">{errors[`document_${index}`]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeIndex === 5 && (
                  <div className="declaration">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.agreement}
                        onChange={(e) => setFormData({ ...formData, agreement: e.target.checked })}
                      />
                      I agree to the terms and conditions and confirm that the information provided is accurate.
                    </label>
                    {errors.agreement && <span className="error">{errors.agreement}</span>}
                  </div>
                )}

                <div className="navigation-buttons">
                  {activeIndex > 0 && (
                    <button type="button" className="back-btn" onClick={handleBack}>
                      Back
                    </button>
                  )}
                  <button type="button" className="save-btn" onClick={handleSave}>
                    Save
                  </button>
                  {activeIndex < sections.length - 1 && (
                    <button type="button" className="next-btn" onClick={handleNext}>
                      Next
                    </button>
                  )}
                  {activeIndex === sections.length - 1 && (
                    <>
                      <button type="button" className="view-btn" onClick={handleViewForm}>
                        View Form
                      </button>
                      <button type="button" className="submit-btn" onClick={handleSubmit}>
                        Submit
                      </button>
                    </>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;