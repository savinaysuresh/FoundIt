// server/controllers/notificationController.js

import Notification from "../models/Notification.js";

/**
 * Get notifications for current user
 * Renamed to getMyNotifications to match frontend api.js
 */
export const getMyNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 20));
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ userId: req.user.id });
    
    const notifications = await Notification.find({ userId: req.user.id })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();

    // --- ADDED THIS ---
    // Your frontend needs the unread count for the bell icon
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });
    // --------------------

    res.json({ 
      notifications, 
      total, 
      page, 
      pages: Math.ceil(total / limit),
      unreadCount // Send the count to the frontend
    });
  } catch (err) {
    console.error("getMyNotifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Mark all notifications as read
 * Renamed and logic changed to match frontend api.js
 */
export const markNotificationsRead = async (req, res) => {
  try {
    // This updates all unread notifications for the user to 'read: true'
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    
    res.json({ message: "All notifications marked read" });
  } catch (err) {
    console.error("markNotificationsRead error:", err);
    res.status(500).json({ message: "Server error" });
  }
};