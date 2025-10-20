// client/src/components/Header.jsx
import React from "react";
import Navbar from "./Navbar";
import NotificationBell from "./NotificationBell"; // 1. Import the bell

const Header = () => (
  // 2. Add layout and styling to the header
  <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
    
    {/* Left side: Title */}
    <h1 className="text-xl font-bold">FoundIt</h1>
    
    {/* Right side: Group the Navbar and Bell */}
    <div className="flex items-center space-x-4">
      <Navbar /> 
      <NotificationBell />
    </div>

  </header>
);

export default Header;