import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";

const MyClaims = () => {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const token = localStorage.getItem("token"); // JWT token
        const res = await axios.get("/api/claims/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClaims(res.data);
      } catch (err) {
        console.error("Error fetching claims:", err);
      }
    };
    fetchClaims();
  }, []);

  return (
    <>
      <Header />
      <div className="container">
        <h2>My Claims</h2>
        <table width="100%" border="1" cellPadding="5">
          <thead>
            <tr>
              {claims[0] &&
                Object.keys(claims[0]).map((key) => <th key={key}>{key}</th>)}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c._id}>
                {Object.keys(c).map((key) => (
                  <td key={key}>
                    {c[key] && typeof c[key] === "object" && !Array.isArray(c[key])
                      ? JSON.stringify(c[key])
                      : Array.isArray(c[key])
                      ? c[key].join(", ")
                      : c[key].toString()}
                  </td>
                ))}
                <td>
                  <button>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default MyClaims;
