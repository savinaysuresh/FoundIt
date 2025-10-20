// server/routes/itemRoutes.js

import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import upload from "../middleware/uploadMiddleware.js";
import Item from "../models/Item.js"; // This is needed for the public GET / route

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
  getMyPosts,
} from "../controllers/itemController.js";

const router = express.Router();

// ======================================================
// 🟢 PUBLIC ROUTES (accessible without login)
// ======================================================

// Handles the search bar on the homepage
router.get("/search", searchItems);

// Gets all items for public browsing (does not populate user details)
router.get("/", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ======================================================
// 🔐 PROTECTED ROUTES (require authentication via 'auth' middleware)
// ======================================================

// Gets all posts for the currently logged-in user
router.get("/my-posts", auth, getMyPosts);

// --- THIS IS THE FIX ---
// This is the single, correct route to get an item's details.
// It's protected and uses the `getItemById` controller, which sends the
// data in the correct format (`{ item, matches }`) that your frontend needs.
router.get("/:id", auth, getItemById);
// -----------------------

// Creates a new item (with image upload)
router.post("/", auth, upload.single("image"), createItem);

// Updates an item
router.put("/:id", auth, upload.single("image"), updateItem);

// Deletes an item
router.delete("/:id", auth, deleteItem);

// Marks an item as resolved
router.post("/:id/resolve", auth, resolveItem);

// Gets all matches for a specific item
router.get("/:id/matches", auth, getMatchesForItem);

// Reruns the matcher for an item
router.post("/:id/rerun-matcher", auth, rerunMatchForItem);


// ======================================================
// 👮 ADMIN-ONLY ROUTE (requires 'admin' role)
// ======================================================
router.get("/admin/all", auth, admin, getItems);


export default router;