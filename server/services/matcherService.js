// server/services/matcherService.js
import Item from "../models/Item.js";
import Match from "../models/Match.js";
import Notification from "../models/Notification.js";

// --- Configuration ---
const TEXT_SCORE_WEIGHT = 0.7; // How much keyword relevance matters
const LOCATION_SCORE_WEIGHT = 0.3; // How much location similarity matters
const MIN_MATCH_THRESHOLD = 0.3; // Minimum combined score to CREATE a Match document
const NOTIFICATION_THRESHOLD = 0.6; // Minimum combined score to SEND a notification

// --- Helper Functions ---

// Simple location scoring (can be made more complex)
function calculateLocationScore(loc1, loc2) {
  if (!loc1 || !loc2) return 0;
  const l1 = loc1.toLowerCase().trim();
  const l2 = loc2.toLowerCase().trim();
  if (l1 === l2) return 1.0; // Perfect match
  if (l1.includes(l2) || l2.includes(l1)) return 0.5; // Partial match
  return 0;
}

// Function to create notification and emit via Socket.IO
const createAndEmitNotification = async (io, onlineUsers, userToNotifyId, matchedItem, matchScore, matchId) => {
  try {
    const notif = await Notification.create({
      userId: userToNotifyId,
      type: 'new_match',
      payload: {
        message: `High-probability match (${(matchScore * 100).toFixed(0)}%) found: "${matchedItem.title}" (${matchedItem.status})`,
        itemId: matchedItem._id,
        matchId: matchId
      }
    });

    // Emit real-time notification if user is online
    if (io && onlineUsers) {
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
 * Main Matching Algorithm:
 * - Uses MongoDB $text search for keyword relevance.
 * - Adds a simple location score.
 * - Normalizes textScore to prevent >100%.
 * - Creates Match documents for scores above MIN_MATCH_THRESHOLD.
 * - Creates Notifications for scores above NOTIFICATION_THRESHOLD.
 */
const runForItem = async (item, io, onlineUsers) => {
  console.log(`🚀 Running matcher for item: ${item.title} (${item._id})`);
  const oppositeStatus = item.status === 'lost' ? 'found' : 'lost';

  // 1. Build the core query using $text search
  const query = {
    status: oppositeStatus,
    category: item.category,
    isResolved: false,
    _id: { $ne: item._id },
    postedBy: { $ne: item.postedBy },
    $text: { $search: `${item.title} ${item.description || ''}` }
  };

  // 2. Projection to get textScore
  const projection = {
    _id: 1,
    title: 1,
    status: 1,
    location: 1,
    postedBy: 1,
    textScore: { $meta: 'textScore' }
  };

  try {
    // 3. Execute search
    const potentialMatches = await Item.find(query, projection)
      .sort({ textScore: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    if (!potentialMatches || potentialMatches.length === 0) {
      console.log("   - No potential matches found via text search.");
      return;
    }

    console.log(`   - Found ${potentialMatches.length} potential candidates via text search.`);

    // ✅ Normalize text scores so max = 1.0
    const maxTextScore = Math.max(...potentialMatches.map(m => m.textScore || 0), 1);

    for (const candidate of potentialMatches) {
      const rawTextScore = candidate.textScore || 0;
      const textScore = Math.min(rawTextScore / maxTextScore, 1.0); // normalized [0–1]
      const locationScore = calculateLocationScore(item.location, candidate.location);

      // Weighted combination
      const combinedScore = (textScore * TEXT_SCORE_WEIGHT) + (locationScore * LOCATION_SCORE_WEIGHT);
      const scorePercent = (combinedScore * 100).toFixed(0);

      // --- Create match if above threshold ---
      if (combinedScore >= MIN_MATCH_THRESHOLD) {
        const lostItem = item.status === 'lost' ? item : candidate;
        const foundItem = item.status === 'found' ? item : candidate;

        try {
          const newMatch = await Match.create({
            lostItemId: lostItem._id,
            foundItemId: foundItem._id,
            score: combinedScore,
            status: 'suggested'
          });

          console.log(`   - ✅ Created Match (${scorePercent}%) between ${lostItem._id} and ${foundItem._id}`);

          // --- Send notifications for high-confidence matches ---
          if (combinedScore >= NOTIFICATION_THRESHOLD) {
            await createAndEmitNotification(io, onlineUsers, lostItem.postedBy, foundItem, combinedScore, newMatch._id);
            await createAndEmitNotification(io, onlineUsers, foundItem.postedBy, lostItem, combinedScore, newMatch._id);
          }

        } catch (error) {
          if (error.code === 11000) {
            console.log(`   - Match between ${lostItem._id} and ${foundItem._id} already exists.`);
          } else {
            console.error(`   - ❌ Error creating match/notification for candidate ${candidate._id}:`, error);
          }
        }
      }
    }

    console.log(`🏁 Finished matcher for item: ${item._id}`);

  } catch (error) {
    console.error(`❌❌ Critical error during matching for item ${item._id}:`, error);
  }
};

export default { runForItem };
