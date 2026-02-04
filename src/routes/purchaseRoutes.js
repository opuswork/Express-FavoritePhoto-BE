import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  purchase,
  listByBuyer,
  listBySeller,
  getById,
} from "../controllers/purchaseController.js";

const router = express.Router();

// 카드 구매 (포인트 결제)
router.post("/", requireAuth, purchase);

// 구매 내역 (구매자) - requireAuth sets req.user
router.get("/buyer", requireAuth, listByBuyer);
router.get("/buyer/:buyerUserId", listByBuyer);

// 판매 내역 (판매자)
router.get("/seller", listBySeller);
router.get("/seller/:sellerUserId", listBySeller);

// 구매 상세
router.get("/:purchaseId", getById);

export default router;
