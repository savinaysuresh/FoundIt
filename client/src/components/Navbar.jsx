import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => (
  <nav>
    <Link to="/">Home</Link>
    <Link to="/report-lost">Report Lost</Link>
    <Link to="/report-found">Report Found</Link>
    <Link to="/my-posts">My Posts</Link>
    <Link to="/my-claims">My Claims</Link>
    <Link to="/admin">Admin</Link>
    <Link to="/login">Login</Link>
    <Link to="/register">Register</Link>
  </nav>
);

export default Navbar;
