import express from "express";
import { create, list, listMy, get, update, cancel } from "../controllers/listingController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", list);
router.get("/my", requireAuth, listMy);
router.get("/:id", get);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", cancel);

export default router;
