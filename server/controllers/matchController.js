import Match from "../models/Match.js";
import Item from "../models/Item.js";
import mongoose from 'mongoose';
import matcherService from "../services/matcherService.js"; // Needed for rerun

// --- Constants for Homepage Matches ---
const HOMEPAGE_MATCH_THRESHOLD = 0.5; // Minimum score to show on homepage
const HOMEPAGE_MATCH_LIMIT = 8;     // Max number of matches to show

// --- Controller Functions ---

/**
 * Get high-scoring, suggested matches relevant to the logged-in user's items
 * for the homepage.
 */
export const getHomepageMatches = async (req, res) => {
    try {
        // Ensure user ID exists before proceeding
        if (!req.user || !req.user.id) {
             return res.status(401).json({ message: "User not authenticated" });
        }
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // 1. Find the user's active (unresolved) items
        const userItems = await Item.find({ postedBy: userId, isResolved: false }).select('_id title status').lean();
        if (!userItems.length) {
            return res.json([]); // User has no active items, so no matches to show
        }
        const userItemIds = userItems.map(i => i._id);

        // 2. Find suggested matches involving these items with a high enough score
        const matches = await Match.find({
            $or: [
                { lostItemId: { $in: userItemIds } },
                { foundItemId: { $in: userItemIds } }
            ],
            status: 'suggested',
            score: { $gte: HOMEPAGE_MATCH_THRESHOLD }
        })
        .populate({
             path: 'lostItemId',
             select: 'title imageUrl status postedBy category location dateEvent isResolved' // Added isResolved
        })
        .populate({
             path: 'foundItemId',
             select: 'title imageUrl status postedBy category location dateEvent isResolved' // Added isResolved
         })
        .sort({ score: -1 }) // Show best matches first
        .limit(HOMEPAGE_MATCH_LIMIT)
        .lean();

        // 3. Format the results for the frontend
        const formattedMatches = matches.map(match => {
            // Determine which item is "mine" and which is the "match"
            const isMyLostItem = userItemIds.some(id => id.equals(match.lostItemId?._id)); // Safe access with ?

             // Handle cases where populate might fail (e.g., deleted item)
            if (!match.lostItemId || !match.foundItemId) {
                console.warn(`Skipping match ${match._id} due to missing item data.`);
                return null;
            }

            const myItem = isMyLostItem ? match.lostItemId : match.foundItemId;
            const matchedItem = isMyLostItem ? match.foundItemId : match.lostItemId;

            // Ensure we don't show matches where the *other* item is resolved
            if (matchedItem.isResolved) {
                return null; // Skip if the matched item isn't active anymore
            }
             // Ensure we don't show matches if the other item is posted by the same user
             // (This should ideally be prevented by the matcherService, but double-check here)
            if (String(myItem.postedBy) === String(matchedItem.postedBy)) {
                 return null;
            }

            // Return a structured object for the frontend ItemCard
            return {
                ...matchedItem, // Spread the matched item's details (title, image, etc.)
                _id: matchedItem._id, // Ensure the ID is correct
                matchInfo: { // Add extra info about the match context
                     matchId: match._id,
                     score: match.score,
                     myPostedItemId: myItem._id,
                     myPostedItemTitle: myItem.title
                }
            };
        }).filter(match => match !== null); // Filter out any null results from checks

        res.json(formattedMatches);

    } catch (error) {
        console.error("getHomepageMatches error:", error);
        res.status(500).json({ message: "Server error fetching homepage matches" });
    }
};


/**
 * Get matches related to current user (items they posted) - Used for a dedicated "My Matches" page maybe?
 */
export const getMyMatches = async (req, res) => {
  try {
     if (!req.user || !req.user.id) {
         return res.status(401).json({ message: "User not authenticated" });
     }
    const userItems = await Item.find({ postedBy: req.user.id }).select("_id");
    const itemIds = userItems.map(i => i._id);

    // Find matches where either lost or found item belongs to the user
    const matches = await Match.find({
      $or: [{ lostItemId: { $in: itemIds } }, { foundItemId: { $in: itemIds } }]
    })
      .populate({ path: 'lostItemId', select: 'title imageUrl status' }) // Populate needed fields
      .populate({ path: 'foundItemId', select: 'title imageUrl status' })
      .sort("-createdAt")
      .lean(); // Use lean

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
      .populate({ path: 'lostItemId', select: 'title status postedBy' }) // Populate specific fields
      .populate({ path: 'foundItemId', select: 'title status postedBy' })
      .populate({ path: 'lostItemId.postedBy', select: 'name email' }) // Populate user details if needed
      .populate({ path: 'foundItemId.postedBy', select: 'name email' })
      .sort("-createdAt")
      .lean(); // Use lean
    res.json(matches);
  } catch (err) {
    console.error("getAllMatches error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Optionally: re-run matcher for an item (admin / owner)
 */
export const rerunMatchForItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

     // Security check: Only owner or admin can rerun
     if (String(item.postedBy) !== String(req.user.id) && req.user.role !== 'admin') {
          return res.status(403).json({ message: "Forbidden" });
     }

     // Pass io and onlineUsers if the service needs them for notifications
     const io = req.app.get("io");
     const onlineUsers = req.app.get("onlineUsers");

    // Rerun asynchronously
    matcherService.runForItem(item, io, onlineUsers).catch(err => {
        console.error(`Error during manual matcher re-run for item ${item._id}:`, err);
        // Maybe notify admin or log more permanently here
    });

    res.json({ message: "Matcher re-run initiated" });
  } catch (err) {
    console.error("rerunMatchForItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};