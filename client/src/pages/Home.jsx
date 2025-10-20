// client/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import ItemCard from "../components/ItemCard"; // Import the new component
import useDebounce from "../utils/useDebounce"; // Import the debounce hook
import { searchItems, getHomepageMatches } from "../utils/api"; // Import API functions

const Home = () => {
  // State for the live search input
  const [searchTerm, setSearchTerm] = useState("");
  // State for the debounced search term that triggers the API call
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay

  // State for storing results and loading status
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // State for high-priority matches
  const [myMatches, setMyMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // --- DATA FETCHING ---

  // Effect to fetch high-priority matches ONCE when the component loads
  useEffect(() => {
    const fetchMyMatches = async () => {
      setLoadingMatches(true);
      try {
        // We'll add a check for a login token here in a real app
        const matchesData = await getHomepageMatches();
        setMyMatches(matchesData);
      } catch (error) {
        // This is expected if the user isn't logged in or has no matches
        console.log("Could not fetch homepage matches.");
        setMyMatches([]);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMyMatches();
  }, []); // Empty array means this runs only once on mount

  // Effect to fetch search results whenever the debounced search term changes
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedSearchTerm) {
        setLoadingSearch(true);
        try {
          const items = await searchItems(debouncedSearchTerm);
          setSearchResults(items);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setLoadingSearch(false);
        }
      } else {
        setSearchResults([]); // Clear results if search box is empty
      }
    };

    fetchSearchResults();
  }, [debouncedSearchTerm]);

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 sm:p-8">
        
        {/* --- SECTION 1: High-Priority Matches (Notifications) --- */}
        {/* This section only appears if matches are found */}
        {myMatches.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
              Potential Matches for Your Posts
            </h2>
            {loadingMatches ? (
              <p className="text-center">Loading your matches...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {myMatches.map(item => (
                  <ItemCard key={`match-${item._id}`} item={item} />
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
          <div className="flex justify-center mb-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for 'lost wallet', 'blue backpack', etc."
              className="w-full md:w-1/2 p-3 border rounded-lg outline-none shadow-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* --- SECTION 3: Search Results --- */}
        <div className="search-results">
          {loadingSearch && <p className="text-center">Searching...</p>}
          
          {/* Message when no results are found */}
          {!loadingSearch && debouncedSearchTerm && searchResults.length === 0 && (
             <p className="text-center text-gray-500">No items found for "{debouncedSearchTerm}".</p>
          )}

          {/* Display results in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {searchResults.map(item => (
              <ItemCard key={`search-${item._id}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;