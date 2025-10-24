/*
Annotated copy of: c:\FoundIt\server\models\Match.js

Explains Mongoose schema definition, field options, indexes, and model export.
*/

import mongoose from "mongoose";

// Define a Mongoose schema for storing matches between a lost and a found item.
const matchSchema = new mongoose.Schema({
  // Reference to the "lost" item (ObjectId referencing Item collection). Indexed for faster lookups.
  lostItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
  // Reference to the "found" item (ObjectId referencing Item collection). Also indexed.
  foundItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
  // Score is a Number between 0 and 1 representing match confidence
  score: { type: Number, required: true }, // 0-1
  // Status enum with default 'suggested'. Indexed to allow queries by status (e.g., suggested | confirmed | rejected).
  status: { type: String, enum: ['suggested', 'confirmed', 'rejected'], default: 'suggested', index: true },
  // createdAt stores creation timestamp; using Date.now ensures timestamp is set on creation
  createdAt: { type: Date, default: Date.now }
});
// Composite unique index to prevent duplicate match documents between the same pair of items.
// This protects against race conditions where the matcher tries to create the same match concurrently.
matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });

// Export the model for use in controllers/services
export default mongoose.model("Match", matchSchema);