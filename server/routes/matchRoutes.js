import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { getMyMatches, getAllMatches } from "../controllers/matchController.js";
import { getHomepageMatches } from '../controllers/matchController.js'; // Adjust path if needed

const router = express.Router();

// GET high-priority matches for the logged-in user's homepage
router.get('/homepage', auth, getHomepageMatches);

// Add other match-related routes here later if needed
// e.g., router.put('/:matchId/confirm', auth, confirmMatch);

// Get matches for current user
router.get("/my", auth, getMyMatches);

// Admin: get all matches
router.get("/", auth, admin, getAllMatches);

export default router;
