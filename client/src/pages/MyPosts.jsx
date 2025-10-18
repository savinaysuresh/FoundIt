import React from "react";
import Header from "../components/Header";

const MyPosts = () => {
  const posts = [
    { id: 1, title: "Laptop", status: "lost", dateEvent: "2025-10-10" },
    { id: 2, title: "Umbrella", status: "found", dateEvent: "2025-10-11" },
  ];

  return (
    <>
      <Header />
      <div className="container">
        <h2>My Posts</h2>
        <table width="100%">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.status}</td>
                <td>{p.dateEvent}</td>
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
