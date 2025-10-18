import React from "react";
import Header from "../components/Header";

const MyClaims = () => {
  const claims = [
    { id: 1, itemId: "Black Wallet", status: "pending", dateClaimed: "2025-10-14" },
    { id: 2, itemId: "Blue Bag", status: "verified", dateClaimed: "2025-10-15" },
  ];

  return (
    <>
      <Header />
      <div className="container">
        <h2>My Claims</h2>
        <table width="100%">
          <thead>
            <tr><th>Item</th><th>Status</th><th>Date</th><th>Action</th></tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td>{c.itemId}</td>
                <td>{c.status}</td>
                <td>{c.dateClaimed}</td>
                <td><button>Cancel</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default MyClaims;
