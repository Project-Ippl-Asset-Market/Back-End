// /routes/transactionRoutes.js
import express from "express";
import {
  createTransactionController,
  updateTransactionController,
} from "../controllers/transactionController.js";
import { validateTransactionData } from "../middleware/validateTransaction.js";

const router = express.Router();

// Rute untuk membuat transaksi dengan validasi
router.post(
  "/create-transaction",
  validateTransactionData,
  createTransactionController
);

// Rute untuk memperbarui status transaksi
router.put("/update-transaction", updateTransactionController);

export default router;
