// client/src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from "react";
import Fuse from 'fuse.js'; // Import Fuse.js
import Header from "../components/Header";
import ItemCard from "../components/ItemCard";
// Import API functions
import { getHomepageMatches, getItems } from "../utils/api";
import { useAuth } from '../context/AuthContext'; // To check login status for matches

// Configure Fuse.js for fuzzy searching
const fuseOptions = {
  keys: [ // Fields to search
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'category', weight: 0.2 },
    { name: 'location', weight: 0.1 }
  ],
  includeScore: true, // Needed for potential thresholding/sorting later
  threshold: 0.4, // Adjust fuzziness (0=exact, 1=anything)
  minMatchCharLength: 2, // Don't search for very short terms
};

const Home = () => {
  // State for search input
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false); // Optional visual feedback

  // State for ALL items fetched for Fuse.js
  const [allItems, setAllItems] = useState([]);
  const [loadingAllItems, setLoadingAllItems] = useState(true);

  // State for homepage matches (potential matches for user's posts)
  const [myMatches, setMyMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const { auth } = useAuth(); // Get user login state

  // Initialize Fuse instance. useMemo prevents re-creating it on every render.
  const fuse = useMemo(() => {
    console.log("2. Initializing Fuse with items:", allItems); // Check if items are loaded correctly
    return new Fuse(allItems, fuseOptions);
  }, [allItems]); // Re-initialize only when allItems changes

  // --- DATA FETCHING EFFECTS ---

  // Effect to fetch ALL items for Fuse search (runs once on mount)
  useEffect(() => {
    const fetchAllItemsForSearch = async () => {
      setLoadingAllItems(true);
      try {
        // Use the getItems function added to api.js
        const responseData = await getItems(); // Fetch data
        console.log("1. Fetched Items Data:", responseData); // Check fetched data format

        // *** FIX: Set state based on actual returned data format ***
        // Based on console log "Fetched items for search: Array(7)", responseData IS the array
        setAllItems(responseData || []);
        // If the backend actually returns { items: [...] }, use this instead:
        // setAllItems(responseData.items || []);

      } catch (error) {
        console.error("Failed to fetch items for search:", error);
        setAllItems([]); // Set empty on error
      } finally {
        setLoadingAllItems(false);
      }
    };
    fetchAllItemsForSearch();
  }, []); // Empty array ensures it runs only once

  // Effect to fetch high-priority matches (runs once or when auth changes)
  useEffect(() => {
    // Only fetch matches if the user is logged in
    if (auth.user) {
      const fetchMyMatches = async () => {
        setLoadingMatches(true);
        try {
          const matchesData = await getHomepageMatches();
          console.log("Fetched homepage matches:", matchesData); // Check match data
          setMyMatches(matchesData);
        } catch (error) {
          console.log("Could not fetch homepage matches (normal if logged out/no matches).");
          setMyMatches([]);
        } finally {
          setLoadingMatches(false);
        }
      };
      fetchMyMatches();
    } else {
      setMyMatches([]); // Clear matches if user logs out
    }
  }, [auth.user]); // Re-run if auth.user changes (login/logout)

  // --- FUSE.JS SEARCH EFFECT ---
  // Replaces the debounced backend search
  useEffect(() => {
    setLoadingSearch(true); // Indicate activity (optional, Fuse is fast)
    // Ensure fuse is initialized and allItems has data before searching
    if (searchTerm.trim() && fuse && allItems.length > 0) {
      console.log("3. Fuse Search Term:", searchTerm);
      const results = fuse.search(searchTerm);
      console.log("4. Fuse Search Results:", results); // Check Fuse output
      // Fuse returns [{ item: {...}, score: N }, ...], extract just the items
      setSearchResults(results.map(result => result.item));
    } else {
      setSearchResults([]); // Clear results if search is empty or Fuse isn't ready
    }
    // Set loading false almost immediately - Fuse is typically instant
    setLoadingSearch(false);
  }, [searchTerm, fuse, allItems]); // Re-run when search term changes or fuse/items update


  return (
    <>
      <Header />
      <div className="container mx-auto p-4 sm:p-8">

        {/* --- SECTION 1: High-Priority Matches --- */}
        {/* Only show if logged in AND matches were found */}
        {auth.user && myMatches.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
              Potential Matches for Your Posts
            </h2>
            {loadingMatches ? (
              <p className="text-center">Loading your matches...</p>
            ) : (
              // Display matches using ItemCard
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {myMatches.map(item => (
                  // Using item._id and potentially matchId for a unique key
                  <ItemCard key={`match-${item._id}-${item.matchInfo?.matchId}`} item={item} />
                ))}
              </div>
            )}
            <hr className="my-8 border-gray-300" />
          </div>
        )}

        {/* --- SECTION 2: Main Welcome & Search Bar --- */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Welcome to FoundIt</h2>
          <p className="text-gray-600 mb-6">
            Post, search, and claim lost or found items easily on campus.
          </p>
          {/* Search Input - triggers Fuse.js search via searchTerm state */}
          <div className="flex justify-center mb-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lost/found items (e.g., 'wallet', 'keys near library')"
              className="w-full md:w-1/2 p-3 border rounded-lg outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
              disabled={loadingAllItems} // Disable input while loading initial data
            />
          </div>
           {/* Show loading indicator while fetching items for Fuse */}
           {loadingAllItems && <p className="text-center text-gray-500 mb-4">Loading items...</p>}
        </div>

        {/* --- SECTION 3: Search Results --- */}
        <div className="search-results mt-8">
          {/* Show searching indicator (optional) */}
          {loadingSearch && searchTerm && <p className="text-center">Searching...</p>}

          {/* Message when no results found */}
          {!loadingSearch && searchTerm && searchResults.length === 0 && !loadingAllItems && (
             <p className="text-center text-gray-500">No items found matching "{searchTerm}".</p>
          )}

          {/* Display Fuse.js search results using ItemCard */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {searchResults.map(item => (
                <ItemCard key={`search-${item._id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;