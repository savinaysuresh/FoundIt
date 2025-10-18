import React, { useState } from "react";
import Header from "../components/Header";
import axios from "axios"; // Import axios

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
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear previous errors

    try {
      // --- THIS IS THE API CALL ---
      // We use "/api/auth/login" because of the proxy in vite.config.js
      // Vite will see "/api" and forward this request to:
      // http://localhost:5000/api/auth/login
      const response = await axios.post("/api/auth/login", formData);

      console.log("Login successful:", response.data);
      // TODO: Handle successful login
      // e.g., save token, redirect user
      // localStorage.setItem('token', response.data.token);
      // window.location.href = '/'; // Redirect to home

    } catch (err) {
      console.error("Login failed:", err);
      // Set error message from server response if it exists
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