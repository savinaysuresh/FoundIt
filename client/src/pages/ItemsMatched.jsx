/*
Annotated copy of: c:\FoundIt\client\src\pages\ItemsMatched.jsx

This document contains the original component with inline comments explaining
syntax, React hooks usage, Fuse.js usage, and navigation logic. This is a
documentation file only — do NOT copy these comments back into the source file.
*/

import React, { useEffect, useState } from "react"; // Import React and specific hooks
import { useLocation, useNavigate } from "react-router-dom"; // Router hooks for reading location state and navigation
import Fuse from "fuse.js"; // Fuse — a lightweight fuzzy-search library

// Functional React component declaration using arrow function syntax
const ItemsMatched = () => {
  // useLocation returns current location object (including `state` passed during navigate)
  const location = useLocation();
  // useNavigate returns a function to programmatically navigate routes
  const navigate = useNavigate();
  // Read `query` passed via location.state by previous route; fallback to empty string
  const query = location.state?.query || "";

  // Component local state using useState hook
  const [allItems, setAllItems] = useState([]); // stores the fetched list of all items
  const [matchedItems, setMatchedItems] = useState([]); // stores search results from Fuse
  const [loading, setLoading] = useState(true); // loading flag for data fetch
  const [error, setError] = useState(null); // store any fetch errors

  // useEffect with empty dependency array runs once on component mount.
  // This effect fetches all items from the API.
  useEffect(() => {
    // Define an async function inside effect to use await
    const fetchItems = async () => {
      try {
        setLoading(true); // set loading state while request is in-flight
        setError(null); // reset previous errors

        // Native fetch call (could be replaced with axios)
        const res = await fetch("http://localhost:5000/api/items");
        // If HTTP status is not 2xx, throw to be caught below
        if (!res.ok) throw new Error("Failed to fetch items");

        // Parse JSON response
        const data = await res.json();
        // API may return { items: [...] } or just an array; handle both shapes
        setAllItems(data.items || data);
      } catch (err) {
        // Log to console for debugging and set user-facing error state
        console.error(err);
        setError("Error fetching items");
      } finally {
        // Always stop loading whether success or error
        setLoading(false);
      }
    };
    // Invoke the async fetch function
    fetchItems();
  }, []); // empty deps -> run once

  // Whenever `query` or `allItems` change, run the fuzzy search
  useEffect(() => {
    // If we have no items, clear matched results
    if (allItems.length === 0) {
      setMatchedItems([]);
      return; // early return avoids creating a Fuse instance unnecessarily
    }

    // Create a Fuse instance with options:
    // - keys: which object properties to inspect
    // - threshold: lower means stricter matching (0 exact, 1 very loose)
    const fuse = new Fuse(allItems, {
      keys: ["name", "description", "category", "location"],
      threshold: 0.4,
    });

    // Perform search using the query string; Fuse returns array of results
    // Each result has shape: { item: <originalItem>, refIndex, score }
    const results = fuse.search(query);
    // Map the results to the underlying item objects and store in state
    setMatchedItems(results.map((r) => r.item));
  }, [query, allItems]); // dependencies: re-run when either changes

  // If there is no query (e.g., a user navigated here without search), redirect to home.
  // This effect watches `query` and `navigate` and runs whenever `query` changes.
  useEffect(() => {
    if (!query) {
      // navigate('/') programmatically changes route to '/'; default replace behavior not used here
      navigate("/");
    }
  }, [query, navigate]);

  // Conditional rendering based on state:
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (matchedItems.length === 0) return <p>No results found for "{query}"</p>;

  // Render a responsive grid of matched items.
  // Note: inline styles used for demonstration; replace with classNames/CSS modules in production.
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
          // Each card is clickable — on click navigate to item details route.
          <div
            key={item._id} // React key prop helps reconciliation
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
            // Inline event handlers for hover transform effect
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {/* Use provided image or placeholder. objectFit keeps aspect ratio */}
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
            {/* Safe access optional chaining used earlier in other files; here we guard with ? when using slice */}
            <p>{item.description?.slice(0, 60)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export the component as default so it can be imported without braces elsewhere
export default ItemsMatched;