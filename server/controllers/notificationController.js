import Notification from "../models/Notification.js";

/**
 * Get notifications for current user
 * Query params: page, limit
 */
export const getNotifications = async (req, res) => {
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

    res.json({ notifications, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Mark a notification as read
 */
export const markRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    notif.read = true;
    await notif.save();
    res.json({ message: "Marked read" });
  } catch (err) {
    console.error("markRead error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
