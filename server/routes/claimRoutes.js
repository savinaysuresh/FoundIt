import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import {
  createClaim,
  getMyClaims,
  getAllClaims,
  updateClaimStatus,
  getClaimsForItem
} from "../controllers/claimController.js";

const router = express.Router();

// Create claim
router.post("/item/:itemId", auth, createClaim);

router.get("/for-item/:itemId", auth, getClaimsForItem);

// Get current user's claims
router.get("/my", auth, getMyClaims);

// Admin: get all claims
router.get("/", auth, admin, getAllClaims);

// Admin: update claim status
router.put("/:id/status", auth, admin, updateClaimStatus);

export default router;
