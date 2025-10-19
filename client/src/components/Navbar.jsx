import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/report-lost">Report Lost</Link>
      <Link to="/report-found">Report Found</Link>
      <Link to="/my-posts">My Posts</Link>
      <Link to="/my-claims">My Claims</Link>
      <Link to="/admin">Admin</Link>

      {user ? (
        <>
          <span style={{ marginLeft: "1rem" }}>Welcome, {user.name}</span>
          <button onClick={handleLogout} style={{ marginLeft: "0.5rem" }}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
