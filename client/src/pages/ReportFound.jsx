import React from "react";
import Header from "../components/Header";

const ReportFound = () => (
  <>
    <Header />
    <div className="container">
      <h2>Report Found Item</h2>
      <input type="text" placeholder="Title" name="title" />
      <textarea placeholder="Description" name="description"></textarea>
      <input type="text" placeholder="Found Location" name="location" />
      <input type="date" name="dateEvent" />
      <input type="file" name="imageUrl" />
      <button>Submit Found Report</button>
    </div>
  </>
);

export default ReportFound;
