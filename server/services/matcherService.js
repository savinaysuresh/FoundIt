// services/matcherService.js
import Item from "../models/Item.js";
import Match from "../models/Match.js";
import Notification from "../models/Notification.js";

/**
 * Matching Algorithm:
 *  - Opposite status (lost ↔ found)
 *  - Same category & nearby location
 *  - Title/description keyword similarity
 *  - Optional: date proximity (within 7 days)
 */
const runForItem = async (item) => {
  try {
    // Step 1: find potential candidates
    const query = {
      category: item.category,
      location: item.location,
      status: item.status === "lost" ? "found" : "lost",
      isResolved: false,
    };

    const candidates = await Item.find(query);

    for (const candidate of candidates) {
      // Step 2: basic textual similarity
      const titleWords = item.title.toLowerCase().split(/\s+/);
      const candidateWords = candidate.title.toLowerCase().split(/\s+/);
      const overlap = titleWords.filter((w) => candidateWords.includes(w));
      const similarity = overlap.length / Math.max(titleWords.length, 1);

      if (similarity < 0.3) continue; // skip low similarity

      // Step 3: check if match already exists
      const exists = await Match.findOne({
        $or: [
          { lostItemId: item._id, foundItemId: candidate._id },
          { lostItemId: candidate._id, foundItemId: item._id },
        ],
      });
      if (exists) continue;

      // Step 4: create a match
      const match = await Match.create({
        lostItemId: item.status === "lost" ? item._id : candidate._id,
        foundItemId: item.status === "found" ? item._id : candidate._id,
      });

      // Step 5: update matchedWith fields
      await Item.updateMany(
        { _id: { $in: [item._id, candidate._id] } },
        { $addToSet: { matchedWith: item.status === "lost" ? candidate._id : item._id } }
      );

      // Step 6: send secure notifications
      const messages = [
        {
          userId: item.postedBy,
          message: `We found a possible match for your ${item.status} item "${item.title}".`,
          relatedItemId: candidate._id,
        },
        {
          userId: candidate.postedBy,
          message: `We found a possible match for your ${candidate.status} item "${candidate.title}".`,
          relatedItemId: item._id,
        },
      ];

      for (const m of messages) {
        await Notification.create({
          userId: m.userId,
          type: "match",
          payload: { matchId: match._id, relatedItemId: m.relatedItemId, message: m.message },
        });
      }
    }
  } catch (err) {
    console.error("❌ matcherService.runForItem error:", err);
  }
};

const matcherService = { runForItem };
export default matcherService;
