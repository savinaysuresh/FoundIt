import React from "react";
import Navbar from "./Navbar";
import NotificationBell from "./NotificationBell";

const Header = () => (
  <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
    
    {}
    <h1 className="text-xl font-bold">FoundIt</h1>
    
    {}
    <div className="flex items-center space-x-4">
      <Navbar /> 
      <NotificationBell />
    </div>

  </header>
);

export default Header;