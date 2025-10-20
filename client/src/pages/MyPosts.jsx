// client/src/pages/MyPosts.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getMyPosts, deleteItem, resolveItem, updateItem } from "../utils/api";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await getMyPosts();
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to fetch posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Delete post
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteItem(id);
      fetchPosts(); // Refresh the list
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post.");
    }
  };

  // Mark as resolved
  const handleResolve = async (id) => {
    if (!window.confirm("Mark this post as resolved?")) return;
    try {
      await resolveItem(id);
      fetchPosts(); // Refresh the list
    } catch (err) {
      console.error("Error marking resolved:", err);
      alert("Failed to mark as resolved.");
    }
  };

  // Edit post
  const handleEdit = async (post) => {
    const newTitle = prompt("Enter new title:", post.title);
    if (newTitle === null || newTitle.trim() === "") return;

    const newDescription = prompt("Enter new description:", post.description);
    if (newDescription === null) return;

    try {
      await updateItem(post._id, {
        title: newTitle,
        description: newDescription,
      });
      fetchPosts(); // Refresh the list
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Failed to update post.");
    }
  };

  if (loading) return <div><Header /><p className="text-center p-8">Loading...</p></div>;
  if (error) return <div><Header /><p className="text-center p-8 text-red-500">{error}</p></div>;

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 sm:p-8">
        <h2 className="text-3xl font-bold mb-6">My Posts</h2>
        
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                {/* --- 1. "DESCRIPTION" COLUMN ADDED --- */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((p) => (
                <tr key={p._id} className={p.isResolved ? 'bg-gray-100 opacity-60' : ''}>
                  
                  {/* Image Column */}
                  <td className="px-4 py-4">
                    <img
                      src={p.imageUrl || 'https://via.placeholder.com/100'}
                      alt={p.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">{p.title}</td>

                  {/* --- 2. "DESCRIPTION" DATA ADDED --- */}
                  {/* 'truncate' prevents long text from breaking the table */}
                  <td className="px-4 py-4 max-w-xs text-sm text-gray-500 truncate" title={p.description}>
                    {p.description}
                  </td>
                  
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.category}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.location}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'lost' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(p.dateEvent).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.postedBy?.email} 
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500" title={p._id}>
                    {p._id}
                  </td>
                  
                  {/* Action Buttons */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-y-2 flex flex-col">
                    <button
                      onClick={() => handleEdit(p)}
                      disabled={p.isResolved}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleResolve(p._id)}
                      disabled={p.isResolved}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 disabled:bg-gray-400"
                    >
                      {p.isResolved ? 'Resolved' : 'Mark Resolved'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {posts.length === 0 && (
          <p className="text-center p-8 text-gray-500">You have not posted any items yet.</p>
        )}
      </div>
    </>
  );
};

export default MyPosts;