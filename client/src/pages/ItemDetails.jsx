import React from "react";
import Header from "../components/Header";

const ItemDetails = () => {
  const item = {
    title: "Black Wallet",
    description: "Leather wallet with cards and cash.",
    category: "Accessories",
    location: "Library",
    status: "found",
    dateEvent: "2025-10-12",
    postedBy: "John Doe",
    imageUrl: "https://via.placeholder.com/250",
  };

  return (
    <>
      <Header />
      <div className="container">
        <h2>{item.title}</h2>
        <img src={item.imageUrl} alt={item.title} width="200" />
        <p><strong>Description:</strong> {item.description}</p>
        <p><strong>Category:</strong> {item.category}</p>
        <p><strong>Location:</strong> {item.location}</p>
        <p><strong>Status:</strong> {item.status}</p>
        <p><strong>Date:</strong> {item.dateEvent}</p>
        <p><strong>Posted by:</strong> {item.postedBy.slice(0, 4)}***</p>
        <button>Claim Item</button>
      </div>
    </>
  );
};

export default ItemDetails;
