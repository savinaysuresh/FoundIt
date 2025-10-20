// client/src/pages/ItemDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import { getItemById, createClaim, getClaimsForItem, updateClaimStatus } from "../utils/api"; 
import { useAuth } from "../context/AuthContext";

const ItemDetails = () => {
  // Page loading and item data
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  
  // Claims data (for owner view)
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

  // New claim form data (for non-owner view)
  const [claimMessage, setClaimMessage] = useState('');
  const [claimError, setClaimError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const { id: itemId } = useParams();
  const { auth, loading: authLoading } = useAuth(); // Get auth state and its loading status
  
  // State to track if the current user is the owner
  const [isOwner, setIsOwner] = useState(false); // Initialize as false

  // Function to fetch all necessary data
  const fetchItemAndClaims = async () => {
    // Prevent fetching if auth isn't loaded or no user/item ID
    if (!itemId || !auth?.user?._id) {
        setLoading(false); // Stop loading if we can't fetch
        // Potentially set an error or just show item details without owner checks
        // For now, let's try fetching the item anyway if not logged in
        try {
            setLoading(true);
             const data = await getItemById(itemId); 
             setItem(data.item);
             setMatches(data.matches || []);
             setIsOwner(false); // Definitely not the owner if not logged in
        } catch(err) {
             setError(err.message || 'Failed to fetch item');
        } finally {
             setLoading(false);
        }
        return; 
    }

    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const data = await getItemById(itemId); 
      
      if (!data || !data.item) {
          throw new Error("Item data not received correctly.");
      }

      setItem(data.item);
      setMatches(data.matches || []);
      
      // *** Safely check ownership AFTER item data is confirmed ***
      const ownerCheck = auth.user._id === data.item.postedBy?._id; 
      setIsOwner(ownerCheck);

      // If they are the owner, fetch the claims
      if (ownerCheck) {
        setLoadingClaims(true);
        const claimsData = await getClaimsForItem(itemId);
        setClaims(claimsData);
        setLoadingClaims(false);
      }
    } catch (err) {
      console.error("Fetch error:", err); // Log the actual error
      setError(err.message || 'Failed to fetch item or claims');
    } finally {
      setLoading(false);
    }
  };

  // Main data fetching effect - runs when component mounts or dependencies change
  useEffect(() => {
    // Only run if AUTH has finished loading and we have an itemId
    if (!authLoading && itemId) {
      fetchItemAndClaims();
    }
     // Cleanup function (optional but good practice)
    return () => {
      // Cancel any pending fetches if component unmounts quickly
    };
  }, [itemId, authLoading, auth?.user?._id]); // Depend on user ID specifically if possible

  // Handler for submitting a new claim
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    // ... (rest of the function is likely correct) ...
    if (!claimMessage.trim()) {
      setClaimError("Please provide a message.");
      return;
    }
    setClaimError(null);
    setClaimSuccess(false);
    try {
      await createClaim({ itemId, message: claimMessage });
      setClaimSuccess(true);
      setClaimMessage('');
    } catch (err) {
      setClaimError(err.message || 'Failed to submit claim. Are you logged in?');
    }
  };
  
  // Handler for Accept/Decline buttons
  const handleClaimResponse = async (claimId, response) => {
    // ... (this function is likely correct) ...
     if (!window.confirm(`Are you sure you want to ${response} this claim?`)) {
      return;
    }
    try {
      await updateClaimStatus(claimId, response);
      fetchItemAndClaims(); // Refresh all page data
    } catch (error) {
      alert(`Failed to ${response} claim: ${error.message}`);
    }
  };

  // --- RENDER LOGIC ---

  // Initial loading state (before item is fetched)
  if (loading) return (
    <>
      <Header />
      <div className="text-center p-8">Loading item details...</div>
    </>
  );

  // Error state
  if (error) return (
    <>
      <Header />
      <div className="text-center p-8 text-red-500">{error}</div>
    </>
  );

  // Item not found state (after loading finishes but item is null)
  if (!item) return (
    <>
      <Header />
      <div className="text-center p-8">Item not found.</div>
    </>
  );

  // --- Main Render ---
  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-3xl">
        {/* --- ITEM DETAILS --- */}
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
        
        {item.isResolved && (
          <div className="p-4 mb-4 text-lg text-center font-bold bg-green-200 text-green-800 rounded-lg">
            This item has been resolved.
          </div>
        )}
        
        <p className="text-xl text-gray-700 mb-4">{item.location}</p>
        <p><strong>Category:</strong> {item.category}</p>
        <p className="text-gray-800 my-6">{item.description}</p>
        {/* Safely access postedBy name */}
        <p className="text-sm text-gray-500">
          Posted by: {item.postedBy?.name || 'Unknown User'} 
        </p>
        <p className="text-sm text-gray-500">
          {item.status === 'lost' ? 'Lost on:' : 'Found on:'} {item.dateEvent ? new Date(item.dateEvent).toLocaleDateString() : 'N/A'}
        </p>

        {/* --- MANAGE CLAIMS SECTION (for owner) --- */}
        {isOwner && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-2xl font-semibold mb-4">Manage Claims</h3>
            {loadingClaims && <p>Loading claims...</p>}
            {!loadingClaims && claims.length === 0 && (
              <p className="text-gray-600">No claims have been submitted for this item yet.</p>
            )}
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim._id} className="border p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    {/* Safely access claimant name and email */}
                    <span className="font-semibold">{claim.claimantId?.name || 'Unknown Claimant'}</span>
                    <span className="text-sm text-gray-500">({claim.claimantId?.email || 'No email'})</span>
                  </div>
                  <p className="text-gray-700 mb-2">"{claim.message}"</p>
                  <div className="flex justify-between items-center mt-4">
                    {claim.status !== 'pending' && (
                      <span className={`font-medium text-sm capitalize px-2 py-1 rounded ${
                        claim.status === 'verified' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {claim.status}
                      </span>
                    )}
                    {!item.isResolved && claim.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleClaimResponse(claim._id, 'verified')}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleClaimResponse(claim._id, 'rejected')}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    <span className="text-xs text-gray-400">
                      {claim.dateClaimed ? new Date(claim.dateClaimed).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- "MAKE A CLAIM" FORM (for non-owner) --- */}
        {!isOwner && auth?.user && !item.isResolved && ( // Check auth.user exists
          <div className="mt-8 border-t pt-6">
            <h3 className="text-2xl font-semibold mb-4">Make a Claim</h3>
            <form onSubmit={handleClaimSubmit}>
              <textarea
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
                placeholder="Prove it's yours. (e.g., 'My wallet has a photo of a dog in it...')"
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