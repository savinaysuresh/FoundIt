// server/services/matcherService.js
import Item from "../models/Item.js";
import Match from "../models/Match.js";
import Notification from "../models/Notification.js";

// Helper function to extract meaningful keywords
const STOP_WORDS = new Set(['a', 'an', 'and', 'the', 'is', 'it', 'in', 'on', 'at', 'for', 'to', 'of', 'i', 'me', 'my', 'myself']);
const getKeywords = (text) => {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/\W+/) // Split by non-word characters
    .filter(word => word.length > 2 && !STOP_WORDS.has(word)); // Remove small words and stop words
};


/**
 * Matching Algorithm:
 * - Opposite status (lost ↔ found)
 * - Same category & case-insensitive location
 * - Title/description keyword similarity
 */
const runForItem = async (item) => {
  try {
    // Step 1: find potential candidates
    const query = {
      category: item.category,
      location: { $regex: new RegExp(`^${item.location}$`, 'i') }, // Case-insensitive exact location
      status: item.status === "lost" ? "found" : "lost",
      isResolved: false,
      postedBy: { $ne: item.postedBy }, // Don't match user's own items
    };

    const candidates = await Item.find(query);
    if (!candidates.length) {
      return; // No candidates, nothing to do
    }

    // Get keywords for the new item ONCE
    const itemKeywords = getKeywords(item.title + " " + (item.description || ""));

    for (const candidate of candidates) {
      // Step 2: basic textual similarity
      const candidateKeywords = getKeywords(candidate.title + " " + (candidate.description || ""));
      
      const overlap = itemKeywords.filter((w) => candidateKeywords.includes(w));
      
      // Jaccard similarity index: (intersection) / (union)
      const totalUniqueWords = new Set([...itemKeywords, ...candidateKeywords]).size;
      const similarity = totalUniqueWords === 0 ? 0 : overlap.length / totalUniqueWords;

      // You can tune this threshold
      if (similarity < 0.20) continue; // skip low similarity (20% keyword overlap)

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
        similarityScore: similarity, // Good to store this!
      });

      // Step 5: update matchedWith fields (BUG FIXED)
      await Item.findByIdAndUpdate(item._id, { $addToSet: { matchedWith: candidate._id } });
      await Item.findByIdAndUpdate(candidate._id, { $addToSet: { matchedWith: item._id } });

      // Step 6: send secure notifications
      const messages = [
        {
          userId: item.postedBy,
          message: `We found a possible match for your ${item.status} item: "${candidate.title}".`,
          relatedItemId: candidate._id,
        },
        {
          userId: candidate.postedBy,
          message: `Someone posted a ${item.status} item that might match your ${candidate.status} item: "${item.title}".`,
          relatedItemId: item._id,
        },
      ];

      for (const m of messages) {
        await Notification.create({
          userId: m.userId,
          type: "match",
          // Your payload structure is great. Let's add the message to it.
          payload: { 
            matchId: match._id, 
            relatedItemId: m.relatedItemId, 
            message: m.message 
          },
        });
      }
    }
  } catch (err) {
    console.error("❌ matcherService.runForItem error:", err);
  }
};

const matcherService = { runForItem };
export default matcherService;