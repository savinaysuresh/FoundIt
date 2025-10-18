import express from "express";
import multer from "multer";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
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
const upload = multer({ dest: "uploads/" });

// CRUD operations
router.post("/", auth, upload.single("image"), createItem);
router.get("/", auth, getItems);
router.get("/:id", auth, getItemById);
router.put("/:id", auth, upload.single("image"), updateItem);
router.delete("/:id", auth, deleteItem);

// Mark as resolved
router.post("/:id/resolve", auth, resolveItem);

// Get matches for a specific item
router.get("/:id/matches", auth, getMatchesForItem);

// Admin / owner: rerun matcher
router.post("/:id/rerun-matcher", auth, rerunMatchForItem);

export default router;
