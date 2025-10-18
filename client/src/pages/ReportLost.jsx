import React from "react";
import Header from "../components/Header";

const ReportLost = () => (
  <>
    <Header />
    <div className="container">
      <h2>Report Lost Item</h2>
      <input type="text" placeholder="Title" name="title" />
      <textarea placeholder="Description" name="description"></textarea>
      <select name="category">
        <option>Electronics</option>
        <option>Clothing</option>
        <option>Documents</option>
        <option>Accessories</option>
        <option>Other</option>
      </select>
      <input type="text" placeholder="Last Seen Location" name="location" />
      <input type="date" name="dateEvent" />
      <input type="file" name="imageUrl" />
      <button>Submit Lost Report</button>
    </div>
  </>
);

export default ReportLost;
