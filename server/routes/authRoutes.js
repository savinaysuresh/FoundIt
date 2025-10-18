import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Register new user
router.post("/register", register);

// Login
router.post("/login", login);

// Get logged-in user profile
router.get("/me", auth, getMe);

export default router;
