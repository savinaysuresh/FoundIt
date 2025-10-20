// src/pages/ReportLost.jsx
import React, { useState } from "react";
import axios from "axios";
import Header from "../components/Header";

const ReportLost = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electronics",
    location: "",
    dateEvent: "",
  });
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      for (const key in formData) data.append(key, formData[key]);
      if (image) data.append("image", image);
      data.append("status", "lost");

      const res = await axios.post("http://localhost:5000/api/items", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      setStatus("✅ Lost item reported successfully!");
      console.log("Response:", res.data);
      setFormData({
        title: "",
        description: "",
        category: "Electronics",
        location: "",
        dateEvent: "",
      });
      setImage(null);
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to submit. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <h2>Report Lost Item</h2>
        <form onSubmit={handleSubmit} className="report-form">
          <input
            type="text"
            placeholder="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <textarea
            placeholder="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>

          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Documents</option>
            <option>Accessories</option>
            <option>Other</option>
          </select>

          <input
            type="text"
            placeholder="Last Seen Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="dateEvent"
            value={formData.dateEvent}
            onChange={handleChange}
            required
          />
          <input type="file" name="image" onChange={handleFileChange} />
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Lost Report"}
          </button>
        </form>
        {status && <p>{status}</p>}
      </div>
    </>
  );
};

export default ReportLost;
