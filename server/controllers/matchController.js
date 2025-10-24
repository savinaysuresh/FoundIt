/*
Annotated copy of: c:\FoundIt\server\controllers\matchController.js

This file contains express-style controller functions. Comments explain Mongoose usage,
population, authorization checks, and the data shapes sent to the frontend.
*/

import Match from "../models/Match.js"; // Mongoose model for matches
import Item from "../models/Item.js"; // Mongoose model for items
import mongoose from 'mongoose'; // For ObjectId conversions and utilities
import matcherService from "../services/matcherService.js"; // service to (re)run matching

// Constants for filtering and limiting homepage matches
const HOMEPAGE_MATCH_THRESHOLD = 0.5; // float threshold 0-1 for showing on homepage
const HOMEPAGE_MATCH_LIMIT = 8;     // number of matches to fetch

// Controller: getHomepageMatches
export const getHomepageMatches = async (req, res) => {
    try {
        // Basic auth guard: req.user should be populated by auth middleware earlier in the chain
        if (!req.user || !req.user.id) {
             return res.status(401).json({ message: "User not authenticated" });
        }
        // Convert string id to mongoose ObjectId for querying
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // 1. Find user's active (unresolved) items:
        // - postedBy equals current user
        // - isResolved false means item still open for matching
        // Use .select to limit returned fields and .lean() to get plain objects
        const userItems = await Item.find({ postedBy: userId, isResolved: false }).select('_id title status').lean();
        if (!userItems.length) {
            // No active items => no matches possible; return empty array for frontend convenience
            return res.json([]);
        }
        const userItemIds = userItems.map(i => i._id);

        // 2. Query Match documents where either lostItemId or foundItemId matches the user's item IDs,
        //    and only suggested status with score above threshold.
        const matches = await Match.find({
            $or: [
                { lostItemId: { $in: userItemIds } },
                { foundItemId: { $in: userItemIds } }
            ],
            status: 'suggested',
            score: { $gte: HOMEPAGE_MATCH_THRESHOLD }
        })
        // Populate the lostItemId and foundItemId fields with selected item fields.
        .populate({
             path: 'lostItemId',
             select: 'title imageUrl status postedBy category location dateEvent isResolved'
        })
        .populate({
             path: 'foundItemId',
             select: 'title imageUrl status postedBy category location dateEvent isResolved'
         })
        .sort({ score: -1 }) // highest score first
        .limit(HOMEPAGE_MATCH_LIMIT)
        .lean(); // return plain JS objects (faster, read-only)

        // 3. Format matches: decide which of the two items is 'mine' vs 'matched item'.
        const formattedMatches = matches.map(match => {
            // Determine whether the lost item is one of the user's items.
            // Use .some with .equals to compare ObjectIds safely (works if they are ObjectId types).
            const isMyLostItem = userItemIds.some(id => id.equals(match.lostItemId?._id));

            // Defensive checks: if population failed for either item, skip the match.
            if (!match.lostItemId || !match.foundItemId) {
                console.warn(`Skipping match ${match._id} due to missing item data.`);
                return null;
            }

            // myItem = the user's own item; matchedItem = the other item in the pair
            const myItem = isMyLostItem ? match.lostItemId : match.foundItemId;
            const matchedItem = isMyLostItem ? match.foundItemId : match.lostItemId;

            // Don't show matches where the *other* item is already resolved
            if (matchedItem.isResolved) {
                return null;
            }
            // Skip matches where both items belong to same user (self-posts)
            if (String(myItem.postedBy) === String(matchedItem.postedBy)) {
                 return null;
            }

            // Build a shaped object returned to frontend: spread matchedItem fields and attach matchInfo
            return {
                ...matchedItem,
                _id: matchedItem._id,
                matchInfo: {
                     matchId: match._id,
                     score: match.score,
                     myPostedItemId: myItem._id,
                     myPostedItemTitle: myItem.title
                }
            };
        }).filter(match => match !== null); // Remove nulls from prior checks

        // Send resulting array
        res.json(formattedMatches);

    } catch (error) {
        console.error("getHomepageMatches error:", error);
        res.status(500).json({ message: "Server error fetching homepage matches" });
    }
};

// Controller: getMyMatches — returns matches where user's items are involved
export const getMyMatches = async (req, res) => {
  try {
     if (!req.user || !req.user.id) {
         return res.status(401).json({ message: "User not authenticated" });
     }
    // Find items posted by current user (only need _id)
    const userItems = await Item.find({ postedBy: req.user.id }).select("_id");
    const itemIds = userItems.map(i => i._id);

    // Find Match docs where either side references the user's item IDs
    const matches = await Match.find({
      $or: [{ lostItemId: { $in: itemIds } }, { foundItemId: { $in: itemIds } }]
    })
      // Populate the relevant item fields so frontend can display item titles/images
      .populate({ path: 'lostItemId', select: 'title imageUrl status' })
      .populate({ path: 'foundItemId', select: 'title imageUrl status' })
      .sort("-createdAt") // newest first
      .lean();

    res.json(matches);
  } catch (err) {
    console.error("getMyMatches error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller: getAllMatches — admin-only listing of all matches
export const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      // populate both item references and the nested postedBy user fields
      .populate({ path: 'lostItemId', select: 'title status postedBy' })
      .populate({ path: 'foundItemId', select: 'title status postedBy' })
      .populate({ path: 'lostItemId.postedBy', select: 'name email' })
      .populate({ path: 'foundItemId.postedBy', select: 'name email' })
      .sort("-createdAt")
      .lean();
    res.json(matches);
  } catch (err) {
    console.error("getAllMatches error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller: rerunMatchForItem — manually re-trigger the matching algorithm for a given item
export const rerunMatchForItem = async (req, res) => {
  try {
    // Fetch the item by id param
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

     // Authorization: allow only owner or admin to trigger a rerun
     if (String(item.postedBy) !== String(req.user.id) && req.user.role !== 'admin') {
          return res.status(403).json({ message: "Forbidden" });
     }

     // Access socket.io and onlineUsers map from app locals if the match service uses them
     const io = req.app.get("io");
     const onlineUsers = req.app.get("onlineUsers");

    // Kick off the service asynchronously and do not await — this avoids blocking the HTTP response.
    // Errors are caught and logged inside the matcherService or here in the catch of the promise.
    matcherService.runForItem(item, io, onlineUsers).catch(err => {
        console.error(`Error during manual matcher re-run for item ${item._id}:`, err);
        // Optionally send admin notification or persist error details elsewhere
    });

    // Respond to the client immediately indicating work started
    res.json({ message: "Matcher re-run initiated" });
  } catch (err) {
    console.error("rerunMatchForItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};