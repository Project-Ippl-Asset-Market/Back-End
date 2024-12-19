import express from "express";
import { saveTotalRevenue } from "../controllers/revenueController.js";

const router = express.Router();

// Route untuk menyimpan total pendapatan
router.post("/revenue", saveTotalRevenue);

export default router;
