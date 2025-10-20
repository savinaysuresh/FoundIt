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
    
    // --- ADDED CHECK ---
    if (item.isResolved) {
      return res.status(400).json({ message: "This item has already been resolved." });
    }
    // -------------------

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
        message: `Someone has claimed your item: "${item.title}"` 
      }
    });

    // emit via socket if possible
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (io && onlineUsers) {
      const ownerSocketId = onlineUsers.get(String(item.postedBy));
      if (ownerSocketId) {
        io.to(ownerSocketId).emit("notification", notif);
        console.log(`📨 Sent real-time claim notification to user ${item.postedBy}`);
      } else {
        console.log(`User ${item.postedBy} is not online for real-time notification.`);
      }
    }

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
 * Item Owner or Admin: update claim status (approve / reject)
 * body: { status: "verified" | "rejected" }
 */
export const updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id: claimId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const claim = await Claim.findById(claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: "This claim has already been actioned." });
    }

    const item = await Item.findById(claim.itemId);
    if (!item) return res.status(404).json({ message: "Related item not found" });

    // --- 1. NEW SECURITY CHECK ---
    // Allow if user is the item owner OR an admin
    if (String(item.postedBy) !== String(userId) && userRole !== 'admin') {
      return res.status(403).json({ message: "Not authorized to update this claim" });
    }

    // --- 2. MAIN LOGIC ---
    claim.status = status;
    await claim.save();

    let notificationMessage = "";

    // --- 3. "ACCEPT" (VERIFIED) LOGIC ---
    if (status === "verified") {
      // A) Resolve the item
      item.isResolved = true;
      await item.save();
      notificationMessage = `Your claim for "${item.title}" has been accepted!`;

      // B) CASCADE: Reject all other pending claims for this item
      await Claim.updateMany(
        { 
          itemId: item._id, 
          _id: { $ne: claim._id }, // $ne = Not Equal (don't reject this one)
          status: "pending" 
        },
        { $set: { status: "rejected" } }
      );
      
      // (Optional) We could loop and send notifications to all rejected claimants
      // but for now, we only notify the one whose claim was actioned.

    } 
    // --- 4. "DECLINE" (REJECTED) LOGIC ---
    else {
      notificationMessage = `Your claim for "${item.title}" has been declined.`;
    }

    // --- 5. NOTIFICATION LOGIC ---
    // Notify the claimant that their status changed
    const claimantNotif = await Notification.create({
      userId: claim.claimantId,
      type: "claim_status",
      payload: { 
        claimId: claim._id, 
        status, 
        itemId: item._id,
        message: notificationMessage
      }
    });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const claimantSocketId = onlineUsers.get(String(claim.claimantId));
      if (claimantSocketId) {
        io.to(claimantSocketId).emit("notification", claimantNotif);
      }
    }

    res.json({ message: "Claim updated", claim });
  } catch (err) {
    console.error("updateClaimStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * Get all claims for a specific item
 * Only the item owner or an admin can see this
 */
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
    }

    const claims = await Claim.find({ itemId: itemId })
      .populate('claimantId', 'name email') // <-- Gets the claimant's info
      .sort({ dateClaimed: -1 });
    
    res.json(claims);

  } catch (err) {
    console.error("getClaimsForItem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteMyClaim = async (req, res) => {
  try {
    const { id: claimId } = req.params;
    const userId = req.user.id;

    const claim = await Claim.findById(claimId);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Security Check: Make sure the user deleting is the one who made the claim
    if (String(claim.claimantId) !== String(userId)) {
      return res.status(403).json({ message: "Not authorized to delete this claim" });
    }

    // Optional: Prevent deletion if the claim is already verified/rejected
    if (claim.status !== 'pending') {
      return res.status(400).json({ message: "Cannot delete a claim that has already been actioned." });
    }

    await claim.deleteOne(); // Use deleteOne() or remove() depending on Mongoose version

    // Optional: Notify the item owner that the claim was cancelled?
    // You could add notification logic here if desired.

    res.json({ message: "Claim cancelled successfully" });

  } catch (err) {
    console.error("deleteMyClaim error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// --- END OF NEW FUNCTION ---