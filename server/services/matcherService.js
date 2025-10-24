/*
Annotated copy of: c:\FoundIt\server\services\matcherService.js

This document explains the matching algorithm: MongoDB text search + simple location scoring,
how Match documents are created, and when notifications are sent. Comments walk through every
logical step for clarity.
*/

import Item from "../models/Item.js"; // Item model used to search candidates
import Match from "../models/Match.js"; // Match model used to persist matches
import Notification from "../models/Notification.js"; // Notifications to inform users

// Configuration constants that tune the algorithm
const TEXT_SCORE_WEIGHT = 0.7; // weight for text relevance (title/description)
const LOCATION_SCORE_WEIGHT = 0.3; // weight for location similarity
const MIN_MATCH_THRESHOLD = 0.3; // if combined score >= this, create a Match record
const NOTIFICATION_THRESHOLD = 0.6; // if combined score >= this, create/send notifications

// Helper: basic location similarity scoring.
// Accepts two location strings and returns a number in [0,1].
function calculateLocationScore(loc1, loc2) {
  if (!loc1 || !loc2) return 0; // missing data -> no location score
  // Normalize strings for comparison
  const l1 = loc1.toLowerCase().trim();
  const l2 = loc2.toLowerCase().trim();
  if (l1 === l2) return 1.0; // exact match => perfect score
  if (l1.includes(l2) || l2.includes(l1)) return 0.5; // partial overlap => medium score
  return 0; // no overlap -> 0
}

// Helper to create a Notification document and emit it over Socket.IO if the user is online.
const createAndEmitNotification = async (io, onlineUsers, userToNotifyId, matchedItem, matchScore, matchId) => {
  try {
    // Create a Notification in DB with type and payload. Payload includes useful IDs for frontend.
    const notif = await Notification.create({
      userId: userToNotifyId,
      type: 'new_match',
      payload: {
        message: `High-probability match (${(matchScore * 100).toFixed(0)}%) found: "${matchedItem.title}" (${matchedItem.status})`,
        itemId: matchedItem._id,
        matchId: matchId
      }
    });

    // If a Socket.IO instance and map of online users are provided, attempt to emit in real time.
    if (io && onlineUsers) {
      // onlineUsers expected to be a Map: userId -> socketId
      const socketId = onlineUsers.get(String(userToNotifyId));
      if (socketId) {
        io.to(socketId).emit('notification', notif);
        console.log(`   - Sent real-time match notification to ${userToNotifyId}`);
      }
    }
  } catch (error) {
    console.error(`   - Failed to create/emit notification for user ${userToNotifyId}:`, error);
  }
};

/**
 * Main matcher function: runForItem
 * - Accepts an item (lost or found), optional io and onlineUsers for notifications.
 * - Finds candidate items of opposite status using MongoDB $text search and category filter.
 * - Calculates a normalized text score + simple location score.
 * - Creates Match documents when combined score >= MIN_MATCH_THRESHOLD.
 * - Emits Notifications for very high-scoring matches.
 */
const runForItem = async (item, io, onlineUsers) => {
  console.log(`🚀 Running matcher for item: ${item.title} (${item._id})`);
  // Determine counterpart status: if current item is 'lost', counterpart should be 'found', and vice versa.
  const oppositeStatus = item.status === 'lost' ? 'found' : 'lost';

  // 1. Build query:
  // - status must be opposite
  // - same category to keep like-with-like (tunable)
  // - item must not be resolved, not itself, and not posted by same user
  // - $text search uses MongoDB text indexes (assumes Item has a text index on title/description)
  const query = {
    status: oppositeStatus,
    category: item.category,
    isResolved: false,
    _id: { $ne: item._id }, // exclude self
    postedBy: { $ne: item.postedBy }, // exclude items by same poster
    $text: { $search: `${item.title} ${item.description || ''}` } // uses title+description as search terms
  };

  // 2. Projection: include textScore metadata from MongoDB $meta operator
  const projection = {
    _id: 1,
    title: 1,
    status: 1,
    location: 1,
    postedBy: 1,
    textScore: { $meta: 'textScore' }
  };

  try {
    // 3. Execute the text search, sort by textScore (higher relevance first), limit candidates for performance
    const potentialMatches = await Item.find(query, projection)
      .sort({ textScore: { $meta: 'textScore' } })
      .limit(20)
      .lean(); // lean for performance (returns plain JS objects)

    if (!potentialMatches || potentialMatches.length === 0) {
      console.log("   - No potential matches found via text search.");
      return; // Nothing to do
    }

    console.log(`   - Found ${potentialMatches.length} potential candidates via text search.`);

    // Normalize textScore to [0..1] by dividing by the max observed score so highest candidate becomes 1
    const maxTextScore = Math.max(...potentialMatches.map(m => m.textScore || 0), 1);

    // Iterate through candidates and compute combined score
    for (const candidate of potentialMatches) {
      const rawTextScore = candidate.textScore || 0;
      // Normalize to range [0,1]
      const textScore = Math.min(rawTextScore / maxTextScore, 1.0);
      // Compute location similarity score using helper
      const locationScore = calculateLocationScore(item.location, candidate.location);

      // Weighted combination of text + location
      const combinedScore = (textScore * TEXT_SCORE_WEIGHT) + (locationScore * LOCATION_SCORE_WEIGHT);
      const scorePercent = (combinedScore * 100).toFixed(0);

      // If combined score meets threshold, attempt to create a Match document
      if (combinedScore >= MIN_MATCH_THRESHOLD) {
        // Determine which side is lost vs found (the Match model expects lostItemId & foundItemId)
        const lostItem = item.status === 'lost' ? item : candidate;
        const foundItem = item.status === 'found' ? item : candidate;

        try {
          // Create match in database. Unique index on (lostItemId, foundItemId) prevents duplicates.
          const newMatch = await Match.create({
            lostItemId: lostItem._id,
            foundItemId: foundItem._id,
            score: combinedScore,
            status: 'suggested'
          });

          console.log(`   - ✅ Created Match (${scorePercent}%) between ${lostItem._id} and ${foundItem._id}`);

          // If score is high enough, send notifications to both owners (lost/found)
          if (combinedScore >= NOTIFICATION_THRESHOLD) {
            // Notify user who posted the lost item about the found item candidate
            await createAndEmitNotification(io, onlineUsers, lostItem.postedBy, foundItem, combinedScore, newMatch._id);
            // Notify user who posted the found item about the lost item candidate
            await createAndEmitNotification(io, onlineUsers, foundItem.postedBy, lostItem, combinedScore, newMatch._id);
          }

        } catch (error) {
          // Handle duplicate-key (11000) gracefully if match already exists
          if (error.code === 11000) {
            console.log(`   - Match between ${lostItem._id} and ${foundItem._id} already exists.`);
          } else {
            console.error(`   - ❌ Error creating match/notification for candidate ${candidate._id}:`, error);
          }
        }
      } // end threshold check
    } // end loop over potential matches

    console.log(`🏁 Finished matcher for item: ${item._id}`);

  } catch (error) {
    // Catch-all for any unexpected error during matching
    console.error(`❌❌ Critical error during matching for item ${item._id}:`, error);
  }
};

// Export an object with runForItem function (default export)
export default { runForItem };