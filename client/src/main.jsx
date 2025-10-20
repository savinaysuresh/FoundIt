import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import "./styles.css";

import { AuthProvider } from './context/AuthContext'; // 1. Import the provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap your App with the provider */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);