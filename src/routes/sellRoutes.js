import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { create } from "../controllers/sellCardController.js";

const router = express.Router();

// GET so you can verify in browser: https://your-backend.onrender.com/api/sell
router.get("/", (req, res) => res.status(200).json({ ok: true, message: "sell" }));
router.post("/", requireAuth, create);

export default router;
