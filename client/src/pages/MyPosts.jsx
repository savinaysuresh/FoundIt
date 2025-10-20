import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const token = localStorage.getItem("token");

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      const res = await axios.get("/api/items", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data.items || res.data); // handle paginated or array
    } catch (err) {
      console.error("Error fetching posts:", err);
      alert("Failed to fetch posts. Please try again.");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Delete post
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`/api/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post.");
    }
  };

  // Mark as resolved
  const handleResolve = async (id) => {
    if (!window.confirm("Mark this post as resolved?")) return;
    try {
      await axios.post(
        `/api/items/${id}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPosts();
    } catch (err) {
      console.error("Error marking resolved:", err);
      alert("Failed to mark as resolved.");
    }
  };

  // Edit post inline using prompt
  const handleEdit = async (post) => {
    const newTitle = prompt("Enter new title:", post.title);
    const newDescription = prompt("Enter new description:", post.description);

    if (newTitle !== null && newDescription !== null) {
      try {
        await axios.put(
          `/api/items/${post._id}`,
          { title: newTitle, description: newDescription },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchPosts();
      } catch (err) {
        console.error("Error updating post:", err);
        alert("Failed to update post.");
      }
    }
  };

  return (
    <>
      <Header />
      <div className="container">
        <h2>My Posts</h2>
        <table width="100%" border="1" cellPadding="5">
          <thead>
            <tr>
              {posts[0] &&
                Object.keys(posts[0]).map((key) => <th key={key}>{key}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p._id}>
                {Object.keys(p).map((key) => (
                  <td key={key}>
                    {p[key] && typeof p[key] === "object" && !Array.isArray(p[key])
                      ? JSON.stringify(p[key])
                      : Array.isArray(p[key])
                      ? p[key].join(", ")
                      : p[key]?.toString()}
                  </td>
                ))}
                <td>
                  <button onClick={() => handleEdit(p)}>Edit</button>{" "}
                  <button onClick={() => handleDelete(p._id)}>Delete</button>{" "}
                  {!p.isResolved && (
                    <button onClick={() => handleResolve(p._id)}>Mark Resolved</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <p>No posts found.</p>}
      </div>
    </>
  );
};

export default MyPosts;
