import express from "express";
import { moveAsset } from "../controllers/moveController.js";

const router = express.Router();

router.post("/moveAsset/:docId", moveAsset);

export default router;
