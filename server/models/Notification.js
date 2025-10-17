import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true }, // e.g. "match", "claim", "claim_status"
  payload: { type: Object, default: {} },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Notification", notificationSchema);
