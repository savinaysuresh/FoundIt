// src/routes/itemRoutes.js
import express from "express";
const router = express.Router();

router.get("/ping", (req, res) => res.json({ ok: true, route: "items" }));

export default router;
