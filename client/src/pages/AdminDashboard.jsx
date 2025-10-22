import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { getAdminStats } from "../utils/api";

const StatCard = ({ title, value, bgColor }) => (
  <div className={`${bgColor} p-6 rounded-lg shadow-md text-center`}>
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAdminStats();
        setStats(data.stats);
        setRecentItems(data.recentItems);
        setRecentUsers(data.recentUsers);
      } catch (err) {
        setError(err.message || "Failed to fetch admin data. Are you an admin?");
      } finally {
        setLoading(false);
      }
    };

    if (!auth.loading && auth.user?.role === "admin") {
      fetchData();
    } else if (!auth.loading) {
      setError("You are not authorized to view this page.");
      setLoading(false);
    }
  }, [auth.loading, auth.user]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-8 text-center">
          Loading dashboard...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-8 text-center text-red-500">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 sm:p-8">
        <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>

        {/* --- Statistics Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? "..."}
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Total Items"
            value={stats?.totalItems ?? "..."}
            bgColor="bg-green-100"
          />
          <StatCard
            title="Pending Claims"
            value={stats?.pendingClaims ?? "..."}
            bgColor="bg-yellow-100"
          />
          <StatCard
            title="Resolved Items"
            value={stats?.resolvedItems ?? "..."}
            bgColor="bg-gray-100"
          />
        </div>

        {/* --- Management Navigation --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Link
            to="/admin/users"
            className="block bg-blue-600 text-white p-8 rounded-lg shadow-lg hover:bg-blue-700 text-center text-2xl font-semibold transition-transform hover:scale-105"
          >
            👥 Manage Users
          </Link>
          <Link
            to="/admin/items"
            className="block bg-green-600 text-white p-8 rounded-lg shadow-lg hover:bg-green-700 text-center text-2xl font-semibold transition-transform hover:scale-105"
          >
            📦 Manage Items
          </Link>
          <Link
            to="/admin/claims"
            className="block bg-yellow-600 text-white p-8 rounded-lg shadow-lg hover:bg-yellow-700 text-center text-2xl font-semibold transition-transform hover:scale-105"
          >
            📝 Manage Claims
          </Link>
        </div>

        {/* --- Recent Activity Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Items */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">📢 Recent Items</h3>
            <ul className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
              {recentItems.length > 0 ? (
                recentItems.map((item) => (
                  <li
                    key={item._id}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: {item.status} | By:{" "}
                        {item.postedBy?.name || "Unknown"}
                      </p>
                    </div>
                    <Link
                      to={`/item/${item._id}`}
                      className="text-blue-500 hover:underline text-sm font-medium"
                    >
                      View
                    </Link>
                  </li>
                ))
              ) : (
                <li className="p-4 text-gray-500">No recent items.</li>
              )}
            </ul>
          </div>

          {/* Recent Users */}
          <div>
            <h3 className="text-2xl font-semibold mb-4">🧑‍💼 Recent Users</h3>
            <ul className="bg-white shadow-md rounded-lg divide-y divide-gray-200">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <li key={user._id} className="p-4">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      {user.email}
                      <br />
                    </p>
                  </li>
                ))
              ) : (
                <li className="p-4 text-gray-500">No recent users.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
