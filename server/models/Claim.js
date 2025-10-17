import mongoose from "mongoose";

const claimSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
  claimantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  message: { type: String },
  status: { type: String, enum: ["pending","verified","rejected"], default: "pending", index: true },
  dateClaimed: { type: Date, default: Date.now }
});
export default mongoose.model("Claim", claimSchema);
