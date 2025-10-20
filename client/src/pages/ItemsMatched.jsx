import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Fuse from "fuse.js";

const ItemsMatched = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("query") || "";

  const [allItems, setAllItems] = useState([]);
  const [matchedItems, setMatchedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all items once
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("http://localhost:5000/api/items");
        if (!res.ok) throw new Error("Failed to fetch items");

        const data = await res.json();
        setAllItems(data.items || data); // adjust if API wraps items in `items`
      } catch (err) {
        console.error(err);
        setError("Error fetching items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Apply fuzzy search whenever query or items change
  useEffect(() => {
    if (!query || allItems.length === 0) {
      setMatchedItems([]);
      return;
    }

    const fuse = new Fuse(allItems, {
      keys: ["name", "description", "category", "location"],
      threshold: 0.4,
    });

    const results = fuse.search(query);
    setMatchedItems(results.map((r) => r.item));
  }, [query, allItems]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (matchedItems.length === 0) return <p>No results found for "{query}"</p>;

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h2>Search Results for "{query}"</h2>
      <div
        className="items-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {matchedItems.map((item) => (
          <div
            key={item._id}
            className="item-card"
            onClick={() => navigate(`/itemDetails/${item._id}`)}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              textAlign: "center",
              cursor: "pointer",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={item.image || "/placeholder.jpg"}
              alt={item.name}
              style={{
                width: "100%",
                height: "160px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <h3>{item.name}</h3>
            <p>
              <strong>Category:</strong> {item.category}
            </p>
            <p>
              <strong>Location:</strong> {item.location}
            </p>
            <p>{item.description?.slice(0, 60)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemsMatched;
