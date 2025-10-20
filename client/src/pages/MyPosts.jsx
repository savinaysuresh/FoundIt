import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token"); // JWT token
        const res = await axios.get("/api/items", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };
    fetchPosts();
  }, []);

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
                      : p[key].toString()}
                  </td>
                ))}
                <td>
                  <button>Edit</button>
                  <button>Delete</button>
                  <button>Mark Resolved</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default MyPosts;
