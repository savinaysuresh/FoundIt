// client/src/components/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import io from 'socket.io-client';
import { getMyNotifications, markNotificationsRead } from '../utils/api'; 
// Assuming you have an AuthContext to get the user ID
// import { useAuth } from '../context/AuthContext'; 

// --- Socket.IO Connection ---
// Connect to your server (adjust path if needed)
const socket = io(undefined, {
  path: "/ws", // This must match your server.js 'path' option
  autoConnect: false,
});
// --------------------------

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  // --- Get the logged-in user's ID ---
  // This is a placeholder. You MUST replace this with your Auth Context.
  // const { user } = useAuth(); 
  // const userId = user?._id;
  
  // --- !!! TEMPORARY PLACEHOLDER !!! ---
  // Replace this with your auth context
  const token = localStorage.getItem("token"); 
  let userId;
  if (token) {
    try {
      userId = JSON.parse(atob(token.split('.')[1])).id;
    } catch(e) { console.error("Bad token"); }
  }
  // --- END PLACEHOLDER ---


  // Function to fetch notifications from the DB
  const fetchNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      // 1. Fetch initial notifications from DB
      fetchNotifications();
      
      // 2. Connect to the WebSocket server
      socket.connect();
      
      // 3. Register this user with the server
      socket.emit("register-user", userId);
      
      // 4. Set up a listener for new notifications
      socket.on("notification", (newNotif) => {
        // Add the new notification to the top of the list
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    }

    // Cleanup on component unmount
    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [userId]); // Re-run if user logs in or out

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    // If opening and there are unread, mark them as read
    if (!isOpen && unreadCount > 0) {
      try {
        await markNotificationsRead();
        setUnreadCount(0);
      } catch (error) {
        console.error("Failed to mark notifications read:", error);
      }
    }
  };
  
  if (!userId) {
    return null; // Don't show the bell if not logged in
  }

  return (
    <div className="notification-bell" style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
        <FaBell size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5, background: 'red',
            color: 'white', borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '12px', display: 'grid', placeItems: 'center', lineHeight: '18px'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" style={{
          position: 'absolute', right: 0, top: '120%', background: 'white',
          border: '1px solid #ccc', borderRadius: '4px', width: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, color: '#333'
        }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '12px' }}>No new notifications</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {notifications.slice(0, 10).map((notif) => (
                <li key={notif._id} style={{ borderBottom: '1px solid #eee' }}>
                  <Link
                    to={`/item/${notif.payload.itemId}`}
                    onClick={() => setIsOpen(false)}
                    style={{ display: 'block', padding: '12px', textDecoration: 'none', color: '#333' }}
                  >
                    <p>{notif.payload.message}</p>
                    <small style={{ color: '#777' }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;