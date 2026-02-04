import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { getAllClaims, updateClaimStatus } from "../utils/api"; 

const AdminClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  let all;
  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError(null);
      // 3. Use the clean getMyClaims function
      const res = await getAllClaims();
      setClaims(res.data);
      all=res.data;
      console.log(res.data);

      console.log(claims);
    } catch (err) {
      console.error("Error fetching claims:", err);
      setError(err.message || "Failed to fetch claims");
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    fetchClaims();
  }, []);
  useEffect(()=>{
    console.log("claims")
    console.log(claims);
  },[claims])

  const handleClaim = async (id) => {
    if (!window.confirm("Are you sure you want to approve this claim?")) return;
    try {
      // Use the new updateClaimStatus function
      await updateClaimStatus(id, "verified");
      fetchClaims(); // Refresh the list
    } catch (err) {
      console.error("Error approving claim:", err);
      alert(`Failed to approve claim: ${err.message}`);
    }
  };
  
  if (loading) return <div><Header /><p className="text-center p-8">Loading...</p></div>;
  if (error) return <div><Header /><p className="text-center p-8 text-red-500">{error}</p></div>;

  return (
    <>
      <div className="container mx-auto p-4 sm:p-8">
        <h2 className="text-3xl font-bold mb-6">All Claims</h2>

        {
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Claimed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claimant Id</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Claimed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map((c) => (
                  <tr key={c._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {c.itemId?.title || 'Deleted Item'}
                    </td>
                    <td className="px-6 py-4 max-w-sm text-sm text-gray-500 truncate" title={c.message}>
                      "{c.claimantId.name}"
                    </td>
                    <td className="px-6 py-4 max-w-sm text-sm text-gray-500 truncate" title={c.message}>
                      "{c.message}"
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-medium capitalize px-2 py-1 rounded text-xs ${
                        c.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                        c.status === 'verified' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(c.dateClaimed).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {c.status === 'pending' && (
                        <button 
                          onClick={() => handleClaim(c._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                        >
                          Approve Claim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </>
  );
};

export default AdminClaims;