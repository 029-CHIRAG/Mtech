import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/authContext";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Courses from "./courses";
import DataScience from "./DataScience";
import ContentAdmin from "./ContentAdmin";
import ContentAdminDescription from "./ContentAdminDescription";
import Contact from "./Contact";
import About from "./About";
import NewCourse from "./NewCourse";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Dashboard from "./Dashboard";
import Description from "./Description";
import StudentDetails from "./StudentDetails";
import AdminDashboard from "./AdminDashboard";
import VerificationAdminDashboard from "./VerificationAdminDashboard";
import VerificationOfficerDashboard from "./VerificationOfficerDashboard";
import VerificationOfficerCreation from "./VerificationOfficerCreation";
import ApplicationForm from "./ApplicationForm";
import ChangePassword from "./ChangePassword";
import NewNotice from "./NewNotice";
import AdminDetails from "./AdminDetails"; 
import Payment from "./Payment";
import RoleCreation from "./RoleCreation";
import Notifications from "./Notifications";

// 🧑‍🏫 Faculty module components
import FacultyLayout from "./faculty/FacultyLayout";
import FacultyDashboard from "./faculty/FacultyDashboard";
import EditFacultyDashboard from "./faculty/EditFacultyDashboard";
import UpdateStudent from "./faculty/UpdateStudent";
import StudentsManagement from "./faculty/StudentsManagement";
import StudentManagementWelcome from "./faculty/StudentManagementWelcome";
import StudentList from "./faculty/StudentList";

import './App.css';

function App() {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem("userId");
    if (userIdFromStorage && !currentUser) {
      setCurrentUser({ userId: userIdFromStorage });
    }
    if (!userIdFromStorage) {
      // Allow unauthenticated users to access only login & register pages
      if (!["/login", "/register"].includes(window.location.pathname)) {
        navigate("/login");
      }
    }
  }, [currentUser, navigate, setCurrentUser]);

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/datascience" element={<DataScience />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />

          {/* Course & Description */}
          <Route path="/add-course" element={<NewCourse />} />
          <Route path="/courses/:courseId" element={<Description />} />

          {/* User Details */}
          <Route path="/user/:id" element={<StudentDetails />} />
          <Route path="/admin/:id" element={<AdminDetails />} />

          {/* Dashboards */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Admindashboard" element={<AdminDashboard />} />
          <Route path="/content-admin" element={<ContentAdmin />} />
          <Route path="/create-user" element={<RoleCreation />} />

          {/* Verification Admin and Officer */}
          <Route path="/verification-admin" element={<VerificationAdminDashboard />} />
          <Route path="/verification-officer" element={<VerificationOfficerDashboard />} />
          <Route path="/VerificationOfficerCreation" element={<VerificationOfficerCreation />} />
          
          {/* Application Form */}
          <Route path="/application/:courseId" element={<ApplicationForm />} />

          {/* Content Admin Specific Actions */}
          <Route path="/content-admin/add-description/:courseId" element={<ContentAdminDescription />} />

          {/* Notices, Payment, Password Notification*/}
          <Route path="/newNotice" element={<NewNotice />} />
          <Route path="/newNotice/:id" element={<NewNotice />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Faculty Dashboard with Nested Routing */}
          <Route path="/faculty" element={<FacultyLayout />}>
            <Route index element={<FacultyDashboard />} />
            <Route path="edit-dashboard" element={<EditFacultyDashboard />} />
            <Route path="update-student" element={<StudentsManagement />}>
              <Route index element={<StudentManagementWelcome />} />
              <Route path=":studentId" element={<UpdateStudent />} />
            </Route>
            {/* Keep the existing students route structure as well */}
            <Route path="students" element={<StudentsManagement />}>
              <Route index element={<StudentManagementWelcome />} />
              <Route path="update/:studentId" element={<UpdateStudent />} />
            </Route>
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;