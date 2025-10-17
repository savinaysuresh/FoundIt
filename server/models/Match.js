import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  lostItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
  foundItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
  score: { type: Number, required: true }, // 0-1
  createdAt: { type: Date, default: Date.now }
});
matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });
export default mongoose.model("Match", matchSchema);
