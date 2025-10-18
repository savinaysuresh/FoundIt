import React from "react";
import Header from "../components/Header";

const Login = () => (
  <>
    <Header />
    <div className="container">
      <h2>Login</h2>
      <input type="email" placeholder="Email" name="email" />
      <input type="password" placeholder="Password" name="password" />
      <button>Login</button>
    </div>
  </>
);

export default Login;
