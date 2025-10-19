// services/matcherService.js
import Item from "../models/Item.js";
import Match from "../models/Match.js";
import Notification from "../models/Notification.js";

const runForItem = async (item) => {
  try {
    // 1. Find potential matches based on category, location, and opposite status
    const query = {
      category: item.category,
      location: item.location,
      status: item.status === "lost" ? "found" : "lost",
      isResolved: false,
    };

    const candidates = await Item.find(query);

    // 2. For each candidate, create a match if not already existing
    for (const candidate of candidates) {
      const exists = await Match.findOne({
        $or: [
          { lostItemId: item._id, foundItemId: candidate._id },
          { lostItemId: candidate._id, foundItemId: item._id },
        ],
      });

      if (!exists) {
        const match = await Match.create({
          lostItemId: item.status === "lost" ? item._id : candidate._id,
          foundItemId: item.status === "found" ? item._id : candidate._id,
        });

        // 3. Notify both owners
        const notifications = [
          { userId: item.postedBy, message: "A matching item was found." },
          { userId: candidate.postedBy, message: "A matching item was found." },
        ];

        for (const n of notifications) {
          await Notification.create({
            userId: n.userId,
            type: "match",
            payload: { matchId: match._id, message: n.message },
          });
        }
      }
    }
  } catch (err) {
    console.error("❌ matcherService.runForItem error:", err);
  }
};

// ✅ Export properly (works with default import)
const matcherService = { runForItem };
export default matcherService;
