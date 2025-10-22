import React from 'react';
import { useNavigate } from 'react-router-dom';

const ItemCard = ({ item }) => {
  const navigate = useNavigate();

  // The claim button now navigates to the item's detail page
  const handleClaim = () => {
    navigate(`/item/${item._id}`);
  };

  return (
    <div className="border rounded-lg shadow-lg overflow-hidden flex flex-col">
      <img
        src={item.imageUrl || 'https://via.placeholder.com/300'}
        alt={item.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
        <p className="text-gray-600 text-sm mb-2">{item.location}</p>
        
        {/* Special banner for high-priority matches */}
        {item.matchInfo && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 my-2 rounded">
            <p className="font-semibold">
              {(item.matchInfo.similarity * 100).toFixed(0)}% Match
            </p>
            <p className="text-sm">
              Matches your post: "{item.matchInfo.myPostedItemTitle}"
            </p>
          </div>
        )}
        
        <div className="mt-auto">
          <button
            onClick={handleClaim}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
          >
            View & Claim
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;