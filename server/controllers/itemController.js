import cloudinaryImport from "../config/cloudinary.js";
import fs from "fs";
import Item from "../models/Item.js";
import Match from "../models/Match.js";
import Notification from "../models/Notification.js";
import matcherService from "../services/matcherService.js";

const cloudinary = cloudinaryImport.v2;

/**
 * Helper: upload image (supports req.file.path or base64 string)
 */
const uploadImage = async (req) => {
  if (req.file && req.file.path) {
    return await cloudinary.uploader.upload(req.file.path, { folder: "foundit" });
  }
  if (req.body.imageBase64) {
    // imageBase64 should be a data URL or base64 string
    return await cloudinary.uploader.upload(req.body.imageBase64, { folder: "foundit" });
  }
  return null;
};

/**
 * Create item (lost or found)
 * Expects fields: title, description, category, location, status (lost/found), dateEvent (optional)
 * Accepts image via multer (req.file) OR req.body.imageBase64
 */
export const createItem = async (req, res) => {
  try {
    const { title, description, category, location, status, dateEvent } = req.body;
    if (!title || !category || !location || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let uploadResult = null;
    try {
      uploadResult = await uploadImage(req);
    } catch (err) {
      console.warn("Image upload failed:", err);
    }

    const item = await Item.create({
      title,
      description,
      category,
      location,
      status,
      dateEvent: dateEvent ? new Date(dateEvent) : undefined,
      imageUrl: uploadResult ? uploadResult.secure_url : undefined,
      imagePublicId: uploadResult ? uploadResult.public_id : undefined,
      postedBy: req.user.id
    });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    matcherService.runForItem(item, io, onlineUsers).catch(err => console.error("Matcher service error (non-fatal):", err)); // Run async

    res.status(201).json(item);
  } catch (err) {
    console.error("createItem error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    // if multer left a temp file, try to remove it
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
  }
};

/**
 * Query items with filters & pagination
 * Query params: q, status, category, location, fromDate, toDate, isResolved, page, limit, sort
 */
export const getItems = async (req, res) => {
  try {
    const {
      q, status, category, location, fromDate, toDate,
      isResolved, page = 1, limit = 12, sort = "-datePosted"
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (typeof isResolved !== "undefined") query.isResolved = isResolved === "true";

    if (location) query.location = { $regex: location, $options: "i" };
    if (fromDate || toDate) {
      query.dateEvent = {};
      if (fromDate) query.dateEvent.$gte = new Date(fromDate);
      if (toDate) query.dateEvent.$lte = new Date(toDate);
    }

    if (q) {
      query.$text = { $search: q };
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const items = await Item.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate("postedBy", "name email");

    const total = await Item.countDocuments(query);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error("getItems error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get single item
 */
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate("postedBy", "name email")
      .lean();
    if (!item) return res.status(404).json({ message: "Item not found" });

    // fetch matches
    const matches = await Match.find({
      $or: [{ lostItemId: item._id }, { foundItemId: item._id }]
    }).limit(20).lean();

    res.json({ item, matches });
  } catch (err) {
    console.error("getItemById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// server/controllers/itemController.js
// ... (keep all your existing imports and functions)

// ... (after your getItemById function)

/**
 * Get all items posted by the currently logged-in user
 */
export const getMyPosts = async (req, res) => {
  try {
    const items = await Item.find({ postedBy: req.user.id })
      .populate("postedBy", "name email") // <-- This gets the email
      .sort({ datePosted: -1 });

    res.json(items);
  } catch (err) {
    console.error("getMyPosts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * Update item (owner or admin)
 */
export const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // permission: owner or admin
    if (String(item.postedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Check which fields are being updated
    const relevantFieldsChanged = ['title', 'description', 'category', 'location', 'status'].some(
        field => req.body[field] !== undefined && item[field] !== req.body[field]
    );

    const updatable = ["title", "description", "category", "location", "status", "dateEvent", "isResolved"];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) item[k] = req.body[k];
    });

    // handle image replacement
    if (req.file || req.body.imageBase64) {
      try {
        // delete old image if exists
        if (item.imagePublicId) {
          await cloudinary.uploader.destroy(item.imagePublicId);
        }
      } catch (err) {
        console.warn("failed deleting old image:", err);
      }
      try {
        const uploadResult = await (async () => {
          if (req.file && req.file.path) return cloudinary.uploader.upload(req.file.path, { folder: "foundit" });
          if (req.body.imageBase64) return cloudinary.uploader.upload(req.body.imageBase64, { folder: "foundit" });
          return null;
        })();
        if (uploadResult) {
          item.imageUrl = uploadResult.secure_url;
          item.imagePublicId = uploadResult.public_id;
        }
      } catch (err) {
        console.warn("image upload failed:", err);
      }
    }

    await item.save();

    // re-run matcher if relevant fields changed
    if (relevantFieldsChanged) {
        console.log(`   - Item ${item._id} updated, re-running matcher.`);
        const io = req.app.get("io");
        const onlineUsers = req.app.get("onlineUsers");
        matcherService.runForItem(item, io, onlineUsers).catch(err => console.error("Matcher service re-run error (non-fatal):", err)); // Run async
    }

    res.json(item);
  } catch (err) {
    console.error("updateItem error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (req.file && req.file.path) {
      try { fs.unlink(req.file.path, () => {}); } catch {}
    }
  }
};

/**
 * Delete item (owner or admin)
 */
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (String(item.postedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // delete cloudinary image
    if (item.imagePublicId) {
      try { await cloudinary.uploader.destroy(item.imagePublicId); } catch (err) { console.warn(err); }
    }

    // remove matches linked to this item
    await Match.deleteMany({ $or: [{ lostItemId: item._id }, { foundItemId: item._id }] });

    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("deleteItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Mark as resolved (owner or admin)
 */
export const resolveItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (String(item.postedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    item.isResolved = true;
    await item.save();

    // optionally notify matched users / claimants
    const io = req.app.get("io");
    // create notifications for matched owners
    const matches = await Match.find({ $or: [{ lostItemId: item._id }, { foundItemId: item._id }] }).lean();
    for (const m of matches) {
      const otherItemId = String(m.lostItemId) === String(item._id) ? m.foundItemId : m.lostItemId;
      const otherItem = await Item.findById(otherItemId);
      if (!otherItem) continue;
      const notif = await Notification.create({
        userId: otherItem.postedBy,
        type: "item_resolved",
        payload: { itemId: item._id, message: "An item matched to yours was resolved." }
      });
      // emit
      if (io) io.emit("notification", { userId: String(otherItem.postedBy), notif });
    }

    res.json({ message: "Marked resolved", item });
  } catch (err) {
    console.error("resolveItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get matches for an item
 */
export const getMatchesForItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const matches = await Match.find({
      $or: [{ lostItemId: itemId }, { foundItemId: itemId }]
    }).populate("lostItemId foundItemId").lean();
    res.json(matches);
  } catch (err) {
    console.error("getMatchesForItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Search items (used by search bar)
 * Matches by title, description, category, or location.
 * Example: /api/items/search?query=phone
 */
export const searchItems = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "No search query provided" });
    }

    // Case-insensitive fuzzy search
    const regex = new RegExp(query, "i");

    const items = await Item.find({
      $or: [
        { title: regex },
        { description: regex },
        { category: regex },
        { location: regex },
      ],
      isResolved: false, // optional: show only unresolved
    })
      .sort({ datePosted: -1 })
      .limit(50)
      .lean();

    if (!items.length) {
      return res.status(200).json({ message: "No items found", items: [] });
    }

    res.status(200).json({ items });
  } catch (error) {
    console.error("Error searching items:", error);
    res.status(500).json({ message: "Server error during search" });
  }
};

export const rerunMatchForItem = async (req, res) => {
  return res.status(501).json({ message: "rerunMatchForItem not implemented yet" });
};

