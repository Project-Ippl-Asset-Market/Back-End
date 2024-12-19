import express from "express";
import { checkAssetByUid } from "../controllers/checkAsset.js";

const router = express.Router();
router.post("/check-asset", checkAssetByUid);

export default router;
