import React, { useState } from "react";
import Header from "../components/Header";
import axios from "axios"; // Import axios
import api from "../utils/api";


const Login = () => {
  // --- State to hold form data ---
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null); // To show errors

  // --- Handle input changes ---
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- Handle form submission ---
  
const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  try {
    const response = await api.post("/auth/login", formData);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.user)); // Save user
    console.log("Login successful:", response.data);
    window.location.href = "/"; // Redirect to home
  } catch (err) {
    console.error("Login failed:", err);
    setError(err.response?.data?.message || "An error occurred during login.");
  }
};


  return (
    <>
      <Header />
      <div className="container">
        {/* Use a form element with an onSubmit handler */}
        <form onSubmit={handleSubmit}>
          <h2>Login</h2>

          {/* Show error message if login fails */}
          {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

          <input
            type="email"
            placeholder="Email"
            name="email"
         
            value={formData.email}
            onChange={handleChange} // Add onChange
            required
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={formData.password}
            onChange={handleChange} // Add onChange
            required
          />
          <button type="submit">Login</button> {/* Set button type to "submit" */}
        </form>
      </div>
    </>
  );
};

export default Login;