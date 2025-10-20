import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import {
  createClaim,
  getMyClaims,
  getAllClaims,
  updateClaimStatus
} from "../controllers/claimController.js";

const router = express.Router();

// Create claim
router.post("/item/:itemId", auth, createClaim);

// Get current user's claims
router.get("/my", auth, getMyClaims);

// Admin: get all claims
router.get("/", auth, admin, getAllClaims);

// Admin: update claim status
router.put("/:id/status", auth, admin, updateClaimStatus);

export default router;
