// src/routes/authRoutes.js
import express from "express";
const router = express.Router();

// temporary placeholder handlers - you'll replace these with real controllers
router.get("/ping", (req, res) => res.json({ ok: true, route: "auth" }));

export default router;
