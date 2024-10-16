import express from "express";
import { checkEmail, checkEmailPost } from "../controllers/authController.js";

const router = express.Router();

// Route untuk memeriksa email dengan GET
router.get("/check-email", checkEmail);

// Route untuk memeriksa email dengan POST
router.post("/check-email", checkEmailPost);

export default router;
