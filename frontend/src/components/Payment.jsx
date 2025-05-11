import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, CreditCard, Banknote, Clock } from "lucide-react";
import "./Payment.css";

const Payment = () => {
  const [userDetails, setUserDetails] = useState({ name: "N/A", email: "N/A" });
  const [appliedCourses, setAppliedCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const paymentOptions = ["Credit Card", "UPI", "Net Banking", "Debit Card", "Wallet"];

  // Fetch user details, applied courses, and payment history
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/user-details`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }
        const data = await response.json();
        setUserDetails({ name: data.name, email: data.email });
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    const fetchAppliedCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/applied-courses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch applied courses");
        }
        const data = await response.json();
        console.log("Fetched applied courses:", data); // Debug log
        setAppliedCourses(data);
      } catch (error) {
        console.error("Error fetching applied courses:", error);
      }
    };

    const fetchPaymentHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch payment history");
        }
        const data = await response.json();
        setPaymentHistory(data);
      } catch (error) {
        console.error("Error fetching payment history:", error);
      }
    };

    fetchUserDetails();
    fetchAppliedCourses();
    fetchPaymentHistory();
  }, []);

  const handleProceed = (course) => {
    console.log("Proceed clicked for course:", course); // Debug log
    setSelectedCourse(course);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicationId: selectedCourse.applicationId,
          courseId: selectedCourse.courseId,
          courseName: selectedCourse.courseName,
          amount: selectedCourse.amount,
          paymentMethod,
          lastDate: selectedCourse.lastDate,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPaymentHistory([...paymentHistory, data.payment]);
        // Remove the paid application from the list
        setAppliedCourses(appliedCourses.filter(course => course.applicationId !== selectedCourse.applicationId));
        setSelectedCourse(null);
        setPaymentMethod("");
        alert("Payment processed successfully!");
      } else {
        alert(data.message || "Payment failed.");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-card">
        {/* Student Information */}
        <div className="student-info">
          <h2>Student Payment Portal</h2>
          <p><strong>Name:</strong> {userDetails.name}</p>
          <p><strong>Email:</strong> {userDetails.email}</p>
        </div>

        {/* Applied Courses */}
        <div className="payment-status">
          <h3>Submitted Applications</h3>
          {appliedCourses.length > 0 ? (
            <ul className="course-list" style={{ listStyle: "none", padding: 0 }}>
              {appliedCourses.map((course) => (
                <li
                  key={course.applicationId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <span>
                    {course.courseName} - ₹{course.amount} ({course.status})
                  </span>
                  <button
                    className="pay-button"
                    onClick={() => handleProceed(course)}
                    style={{ padding: "8px 16px", fontSize: "14px" }}
                  >
                    Proceed for Payment
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No applications submitted.</p>
          )}
        </div>

        {/* Payment Form */}
        {selectedCourse && (
          <div className="payment-status">
            <XCircle size={50} className="icon error" />
            <h3>Pending Payment</h3>
            <p><strong>Course:</strong> {selectedCourse.courseName}</p>
            <p><strong>Total Due:</strong> ₹{selectedCourse.amount}</p>
            <p><strong>Status:</strong> {selectedCourse.status}</p>
            <p className="due-date">
              <Clock size={18} /> Last Date: {selectedCourse.lastDate}
            </p>

            {/* Payment Method Selection */}
            <div className="payment-methods">
              <h4>Select Payment Method:</h4>
              <div className="options">
                {paymentOptions.map((method) => (
                  <button
                    key={method}
                    className={`payment-option ${paymentMethod === method ? "selected" : ""}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Pay Now Button */}
            <button className="pay-button" onClick={handlePayment}>
              <CreditCard size={20} /> Pay Now
            </button>
          </div>
        )}

        {/* Payment History */}
        <div className="payment-history">
          <h3>Transaction History</h3>
          {paymentHistory.length > 0 ? (
            <ul>
              {paymentHistory.map((record, index) => (
                <li key={index}>
                  <Banknote size={18} /> {new Date(record.paymentDate).toLocaleDateString()} - ₹{record.amount} ({record.courseName} via {record.paymentMethod})
                </li>
              ))}
            </ul>
          ) : (
            <p>No transactions found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;