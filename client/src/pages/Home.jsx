import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const Home = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() !== "") {
      // ✅ Pass query using React Router state instead of URL
      navigate("/items-matched", { state: { query } });
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto text-center p-8">
        <h2 className="text-3xl font-bold mb-2">Welcome to FoundIt</h2>
        <p className="text-gray-600 mb-6">
          Post, search, and claim lost or found items easily on campus.
        </p>

        {/* 🔍 Search Bar */}
        <form onSubmit={handleSearch} className="flex justify-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for lost or found items..."
            className="w-1/2 p-2 border rounded-l-lg outline-none"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>
    </>
  );
};

export default Home;
