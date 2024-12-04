import express from "express";
import { downloadAndProcessFile } from "../controllers/myAssetController.js";

const router = express.Router();

router.get("/proxy/download", downloadAndProcessFile);

export default router;
