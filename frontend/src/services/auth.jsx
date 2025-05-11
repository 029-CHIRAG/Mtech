import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}`; // Backend URL

// Register a new user
export const registerUser = async (email, password, role) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { email, password, role });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get courses (Protected Route)
export const getCourses = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/api/courses`, {
      headers: { "x-auth-token": token },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
