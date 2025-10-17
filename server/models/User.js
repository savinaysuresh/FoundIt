import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // enforce college domain at register time
  passwordHash: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ["user","admin"], default: "user" },
  verifiedEmail: { type: Boolean, default: false },
  socketId: { type: String, default: null }, // current socket for real-time pushes
  dateJoined: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);
