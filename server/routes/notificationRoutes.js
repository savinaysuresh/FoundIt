import express from "express";
import auth from "../middleware/auth.js";
import { getNotifications, markRead } from "../controllers/notificationController.js";

const router = express.Router();

// Get notifications for current user
router.get("/", auth, getNotifications);

// Mark a notification as read
router.put("/:id/read", auth, markRead);

export default router;
