import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Helper: create JWT
 */
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/**
 * Register new user (college email restriction)
 * Expects: { name, email, password, phone }
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }

    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || "").replace(/^@/, "");
    if (!email.toLowerCase().endsWith(`@${allowedDomain}`)) {
      return res.status(400).json({ message: `Only ${allowedDomain} emails are allowed.` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone
    });

    const token = createToken(user);
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Login
 * Expects: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return res.status(401).json({ message: "Invalid credentials" });

    // domain check (defensive)
    const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || "").replace(/^@/, "");
    if (!user.email.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({ message: `Only ${allowedDomain} emails are allowed.` });
    }

    const token = createToken(user);
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get profile (protected route uses req.user set by auth middleware)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
