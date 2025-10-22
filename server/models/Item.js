import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true, index: true },
  location: { type: String, required: true, index: true },
  status: { type: String, enum: ["lost","found"], required: true, index: true },
  datePosted: { type: Date, default: Date.now },
  dateEvent: { type: Date }, // date lost or found
  imageUrl: { type: String },
  imagePublicId: { type: String }, // for Cloudinary deletion
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  isResolved: { type: Boolean, default: false, index: true },
  //matchedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "Item" }] // store multiple matches
});

itemSchema.index({ title: "text", description: "text", category: 1, location: 1 });

const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);
export default Item
