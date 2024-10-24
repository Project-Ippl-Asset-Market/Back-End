// routes/checkAssetRoutes.js
import express from "express";
import { checkAssetByUid } from "../controllers/checkAsset.js"; // Import the new controller

const router = express.Router();

// Route to check asset ownership by UID
router.post("/check-asset", checkAssetByUid);

export default router;
