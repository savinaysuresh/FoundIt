// server/routes/notificationRoutes.js

import express from "express";
import auth from "../middleware/auth.js";

// 1. Import the new, corrected function names
import { 
  getMyNotifications, 
  markNotificationsRead 
} from "../controllers/notificationController.js";

const router = express.Router();

// Get notifications for current user
// This route (/) corresponds to /api/notifications
router.get("/", auth, getMyNotifications);

// Mark all notifications as read
// 2. Changed route from /:id/read to /read
router.put("/read", auth, markNotificationsRead);

export default router;