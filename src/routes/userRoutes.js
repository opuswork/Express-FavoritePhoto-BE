import express from "express";
import * as userController from "../controllers/userController.js";
import * as notificationController from "../controllers/notificationController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/me", requireAuth, userController.getMe);
router.get("/me/cards", requireAuth, userController.getMyCards);
router.get("/me/notifications", requireAuth, notificationController.getMyNotifications);

router.get("/auth/google", userController.getAuthGoogle);
router.get("/auth/google/callback", userController.getAuthGoogleCallback);
router.get("/auth/google/done", userController.getAuthGoogleDone);

export default router;
