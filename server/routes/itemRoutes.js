import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import upload from "../middleware/uploadMiddleware.js"; // use central upload middleware
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  resolveItem,
  getMatchesForItem,
  rerunMatchForItem
} from "../controllers/itemController.js";

const router = express.Router();

// ---------------- CRUD Operations ----------------

// Create item (with image upload)
router.post("/", auth, upload.single("image"), createItem);

// Get all items (with filters/pagination)
router.get("/", auth, getItems);

// Get single item by ID
router.get("/:id", auth, getItemById);

// Update item (with image upload)
router.put("/:id", auth, upload.single("image"), updateItem);

// Delete item (owner or admin)
router.delete("/:id", auth, deleteItem);

// ---------------- Item Actions ----------------

// Mark item as resolved (owner or admin)
router.post("/:id/resolve", auth, resolveItem);

// Get matches for a specific item
router.get("/:id/matches", auth, getMatchesForItem);

// Admin or owner: rerun matcher for an item
router.post("/:id/rerun-matcher", auth, rerunMatchForItem);

export default router;

