// server/controllers/claimController.js
import Claim from "../models/Claim.js";
import Item from "../models/Item.js";
import Notification from "../models/Notification.js";

/**
* Create a claim for an item
* Expects: { message } in body, :itemId in params
*/
export const createClaim = async (req, res) => {
  try {
    const { message } = req.body;
    const { itemId } = req.params;
    if (!itemId) return res.status(400).json({ message: "itemId required" });

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.postedBy.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: "You cannot claim your own item." });
    }

    const claim = await Claim.create({
      itemId,
      claimantId: req.user.id,
      message
    });

    // create notification for item owner
    const notif = await Notification.create({
      userId: item.postedBy,
      type: "claim_new",
      payload: {
        claimId: claim._id,
        itemId: item._id,
        // --- Improved Message ---
        message: `Someone has claimed your item: "${item.title}"` 
      }
    });

    // --- UPDATED SOCKET LOGIC ---
    // emit via socket if possible
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers"); // 1. Get the map

    if (io && onlineUsers) {
      // 2. Find the owner's specific socket ID
      const ownerSocketId = onlineUsers.get(String(item.postedBy));
      
      if (ownerSocketId) {
        // 3. Send the notification ONLY to that user
        io.to(ownerSocketId).emit("notification", notif);
        console.log(`📨 Sent real-time claim notification to user ${item.postedBy}`);
      } else {
        console.log(`User ${item.postedBy} is not online for real-time notification.`);
      }
    }
    // --- END OF UPDATE ---

    res.status(201).json(claim);
  } catch (err) {
    console.error("createClaim error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get claims by current user
 */
export const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimantId: req.user.id })
      .populate("itemId", "title category location")
      .sort("-dateClaimed");
    res.json(claims);
  } catch (err) {
    console.error("getMyClaims error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Admin: get all claims
 */
export const getAllClaims = async (req, res) => {
  try {
    // ensure admin check is done in route middleware
     const claims = await Claim.find()
      .populate("itemId", "title postedBy")
      .populate("claimantId", "name email")
      .sort("-dateClaimed");
    res.json(claims);
  } catch (err) {
    console.error("getAllClaims error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Admin: update claim status (approve / reject)
 * body: { status: "verified" | "rejected" }
 */
export const updateClaimStatus = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    const { status } = req.body;
    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    claim.status = status;
    await claim.save();

    // notify claimant and item owner
    const item = await Item.findById(claim.itemId);
    const claimantNotif = await Notification.create({
      userId: claim.claimantId,
      type: "claim_status",
      payload: { claimId: claim._id, status, itemId: item._id }
   });

    const ownerNotif = await Notification.create({
      userId: item.postedBy,
      type: "claim_update",
      payload: { claimId: claim._id, status, itemId: item._id }
    });

    // --- UPDATED SOCKET LOGIC ---
    // This logic should also be targeted, not a global broadcast
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (io && onlineUsers) {
      // Notify the claimant
      const claimantSocketId = onlineUsers.get(String(claim.claimantId));
      if (claimantSocketId) {
        io.to(claimantSocketId).emit("notification", claimantNotif);
      }
      
      // Notify the owner
      const ownerSocketId = onlineUsers.get(String(item.postedBy));
      if (ownerSocketId) {
        io.to(ownerSocketId).emit("notification", ownerNotif);
      }
    }
    // --- END OF UPDATE ---

    res.json({ message: "Claim updated", claim });
  } catch (err) {
    console.error("updateClaimStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getClaimsForItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Security check: Only owner or admin can see claims
    if (String(item.postedBy) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to view claims" });
  D }

    const claims = await Claim.find({ itemId: itemId })
      .populate('claimantId', 'name email') // <-- Gets the claimant's info
      .sort({ dateClaimed: -1 });
    
    res.json(claims);

  } catch (err) {
    console.error("getClaimsForItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};