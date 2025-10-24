/*
Annotated copy of: c:\FoundIt\server\routes\matchRoutes.js

Explains the router setup, middleware usage, and endpoints registered for matches.
*/

import express from "express";
import auth from "../middleware/auth.js"; // Authentication middleware (verifies JWT, sets req.user)
import admin from "../middleware/admin.js"; // Admin-only middleware (checks req.user.role)
import { getMyMatches, getAllMatches } from "../controllers/matchController.js";
import { getHomepageMatches } from '../controllers/matchController.js'; // import homepage-specific controller

const router = express.Router(); // Create a new router instance

// Public route: GET /api/matches/homepage — requires auth; returns high-priority matches for current user's homepage
router.get('/homepage', auth, getHomepageMatches);

// Additional match-related routes could be added here (confirm, reject, etc.)

// Get matches related to current user (requires auth)
router.get("/my", auth, getMyMatches);

// Admin route: GET /api/matches/ — requires auth + admin to list all matches
router.get("/", auth, admin, getAllMatches);

export default router; // Export router to be mounted in server.js (e.g., app.use('/api/matches', matchRoutes))