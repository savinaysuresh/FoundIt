import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { getMyMatches, getAllMatches } from "../controllers/matchController.js";

const router = express.Router();

// Get matches for current user
router.get("/my", auth, getMyMatches);

// Admin: get all matches
router.get("/", auth, admin, getAllMatches);

export default router;
