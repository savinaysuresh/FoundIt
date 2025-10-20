import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import {
  createClaim,
  getMyClaims,
  getAllClaims,
  updateClaimStatus,
  getClaimsForItem,
  deleteMyClaim
} from "../controllers/claimController.js";

const router = express.Router();

// Create claim
router.post("/item/:itemId", auth, createClaim);

// Get all claims for a specific item (for item owner)
router.get("/for-item/:itemId", auth, getClaimsForItem);

// Get current user's claims
router.get("/my", auth, getMyClaims);

router.delete("/:id", auth, deleteMyClaim);

// Admin: get all claims
router.get("/", auth, admin, getAllClaims);

// --- THIS IS THE FIX ---
// Admin OR Item Owner: update claim status
// Removed 'admin' middleware so item owners can access this route.
router.put("/:id/status", auth, updateClaimStatus);

export default router;