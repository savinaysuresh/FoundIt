import React from "react";
import Header from "../components/Header";

const AdminDashboard = () => {
  const items = [
    { id: 1, title: "Wallet", user: "John", status: "pending" },
    { id: 2, title: "Phone", user: "Riya", status: "found" },
  ];

  return (
    <>
      <Header />
      <div className="container">
        <h2>Admin Dashboard</h2>
        <table width="100%">
          <thead>
            <tr><th>Title</th><th>User</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.title}</td>
                <td>{i.user}</td>
                <td>{i.status}</td>
                <td>
                  <button>Approve</button>
                  <button>Reject</button>
                  <button>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminDashboard;
