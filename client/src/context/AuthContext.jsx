// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api'; // Import your base API instance

// 1. Create the Context
const AuthContext = createContext(null);

// 2. Create the Provider (this will wrap your app)
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ user: null, token: null });
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    // Check for a token in localStorage when the app loads
    const token = localStorage.getItem('token');
    if (token) {
      // Decode token to get user info (basic, not for security check)
      try {
        const user = JSON.parse(atob(token.split('.')[1]));
        setAuth({ user: { _id: user.id, email: user.email, name: user.name, role: user.role }, token: token });
      } catch (e) {
        console.error("Invalid token:", e);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      // Decode user from new token
      const user = JSON.parse(atob(data.token.split('.')[1]));
      setAuth({ user: { _id: user.id, email: user.email, name: user.name, role: user.role }, token: data.token });
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setAuth({ user: null, token: null });
  };

  // The value to be passed to all components
  const value = {
    auth,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 3. Create the custom hook (this is what ItemDetails.jsx needs)
export const useAuth = () => {
  return useContext(AuthContext);
};