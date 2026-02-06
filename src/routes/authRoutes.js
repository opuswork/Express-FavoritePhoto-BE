import express from 'express';
import { requestVerification, verifyCode } from '../controllers/authController.js';

const router = express.Router();

// This links the URL path to the function we just wrote
router.post('/request-verification', requestVerification);
router.post('/verify-code', verifyCode); // New endpoint!

export default router;