import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import upload from "../middleware/uploadMiddleware.js";
import Item from "../models/item.js"; // ✅ make sure this import exists

import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  resolveItem,
  getMatchesForItem,
  rerunMatchForItem,
    searchItems,
} from "../controllers/itemController.js";

const router = express.Router();

// ------------------------------------------------------
// 🟢 PUBLIC ROUTES (accessible without login)
// ------------------------------------------------------
// 🔍 Search (no auth required if you want public search)
router.get("/search", searchItems);

// Get all items (used for fuzzy search and public browsing)
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get one item by ID (used in ItemDetails page)
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching item by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------------------------------------
// 🔐 PROTECTED ROUTES (require authentication)
// ------------------------------------------------------

// Create item (with image upload)
router.post("/", auth, upload.single("image"), createItem);

// Update item
router.put("/:id", auth, upload.single("image"), updateItem);

// Delete item
router.delete("/:id", auth, deleteItem);

// Mark item as resolved (owner or admin)
router.post("/:id/resolve", auth, resolveItem);

// Get matches for a specific item
router.get("/:id/matches", auth, getMatchesForItem);

// Admin or owner: rerun matcher for an item
router.post("/:id/rerun-matcher", auth, rerunMatchForItem);

// ------------------------------------------------------
// ✅ Optional: admin-only route (example)
// ------------------------------------------------------
router.get("/admin/all", auth, admin, getItems);

export default router;
