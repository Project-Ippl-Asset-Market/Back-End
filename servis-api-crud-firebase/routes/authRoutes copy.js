import express from "express";
import { checkEmail, resetPassword } from "../controllers/authController.js";

const router = express.Router();

// Route untuk memeriksa email
router.post("/check-email", checkEmail);

// Route untuk mereset kata sandi
router.post("/reset-password", resetPassword);

export default router;
