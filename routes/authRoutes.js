import express from "express";
import { checkEmail, checkEmailPost } from "../controllers/authController.js";

const router = express.Router();

router.get("/check-email", checkEmail);
router.post("/check-email", checkEmailPost);

export default router;
