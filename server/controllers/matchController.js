import Match from "../models/Match.js";
import Item from "../models/Item.js";

/**
 * Get matches related to current user (items they posted)
 */
export const getMyMatches = async (req, res) => {
  try {
    const userItems = await Item.find({ postedBy: req.user.id }).select("_id");
    const itemIds = userItems.map(i => i._id);

    const matches = await Match.find({
      $or: [{ lostItemId: { $in: itemIds } }, { foundItemId: { $in: itemIds } }]
    })
      .populate("lostItemId foundItemId")
      .sort("-createdAt");

    res.json(matches);
  } catch (err) {
    console.error("getMyMatches error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Admin: get all matches
 */
export const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("lostItemId foundItemId")
      .sort("-createdAt");
    res.json(matches);
  } catch (err) {
    console.error("getAllMatches error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Optionally: re-run matcher for an item (admin / owner)
 */
import matcherService from "../services/matcherService.js";
export const rerunMatchForItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await matcherService.runForItem(item);
    res.json({ message: "Matcher re-run started" });
  } catch (err) {
    console.error("rerunMatchForItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
