// client/src/pages/ItemDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
// Import the API functions we created
import { getItemById, createClaim } from "../utils/api";
// You might need auth context to see if the user is the owner
// import { useAuth } from "../context/AuthContext";

const ItemDetails = () => {
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for the claim form
  const [claimMessage, setClaimMessage] = useState('');
  const [claimError, setClaimError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const { id: itemId } = useParams(); // Get the item ID from the URL
  // const { auth } = useAuth(); // Get auth state
  // const isOwner = auth?.user?._id === item?.postedBy?._id;

  // 1. Fetch item data on load
  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        // This calls your backend: GET /api/items/:id
        const data = await getItemById(itemId); 
        setItem(data.item);
        setMatches(data.matches || []); // Get matches from backend
      } catch (err) {
        setError(err.message || 'Failed to fetch item');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  // 2. Handle the claim submission
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimMessage.trim()) {
      setClaimError("Please provide a message.");
      return;
    }
    
    setClaimError(null);
    setClaimSuccess(false);

    try {
      // This calls your backend: POST /api/claims/item/:itemId
      await createClaim({ itemId, message: claimMessage });
      setClaimSuccess(true);
      setClaimMessage(''); // Clear message box
    } catch (err) {
      setClaimError(err.message || 'Failed to submit claim. Are you logged in?');
    }
  };

  if (loading) return (
    <>
      <Header />
      <div className="text-center p-8">Loading...</div>
    </>
  );
  if (error) return (
    <>
      <Header />
      <div className="text-center p-8 text-red-500">{error}</div>
    </>
  );
  if (!item) return (
    <>
      <Header />
      <div className="text-center p-8">Item not found.</div>
    </>
  );

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-3xl">
        <img 
          src={item.imageUrl || 'https://via.placeholder.com/600x400'} 
          alt={item.title} 
          className="w-full h-96 object-cover rounded-lg mb-4" 
        />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-4xl font-bold">{item.title}</h2>
          <span className={`px-3 py-1 font-semibold rounded-full ${item.status === 'lost' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
            {item.status.toUpperCase()}
          </span>
        </div>
        <p className="text-xl text-gray-700 mb-4">{item.location}</p>
        <p><strong>Category:</strong> {item.category}</p>
        <p className="text-gray-800 my-6">{item.description}</p>
        <p className="text-sm text-gray-500">
          Posted by: {item.postedBy.name}
        </p>
        <p className="text-sm text-gray-500">
          {item.status === 'lost' ? 'Lost on:' : 'Found on:'} {new Date(item.dateEvent).toLocaleDateString()}
        </p>

        {/* --- 3. CLAIM FORM --- */}
        {/* We'll show this if the user is logged in and is NOT the owner */}
        {/* You would uncomment the 'isOwner' logic if you have auth context */}
        {/* {!isOwner && auth.user && ( */}
        { (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-2xl font-semibold mb-4">Make a Claim</h3>
            <p className="mb-4">
              {item.status === 'found' 
                ? "Do you think this is your item? Send a message to the poster to start the claim process."
                : "Do you think you found this person's item? Let them know!"
              }
            </p>
            <form onSubmit={handleClaimSubmit}>
              <textarea
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
                placeholder={
                  item.status === 'found'
                  ? "Prove it's yours. (e.g., 'My wallet has a photo of a dog in it...')"
                  : "Describe where you found it. (e.g., 'I found this in the cafeteria...')"
                }
                className="w-full p-2 border rounded mb-2"
                rows="4"
                required
              ></textarea>
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                Submit Claim
              </button>
              {claimSuccess && <p className="text-green-600 mt-2">Claim submitted successfully!</p>}
              {claimError && <p className="text-red-500 mt-2">{claimError}</p>}
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default ItemDetails;