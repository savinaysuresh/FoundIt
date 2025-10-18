import React from "react";
import Header from "../components/Header";

const Register = () => (
  <>
    <Header />
    <div className="container">
      <h2>Register</h2>
      <input type="text" placeholder="Full Name" name="name" />
      <input type="email" placeholder="Email" name="email" />
      <input type="password" placeholder="Password" name="passwordHash" />
      <input type="text" placeholder="Phone Number" name="phone" />
      <select name="role">
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button>Register</button>
    </div>
  </>
);

export default Register;
