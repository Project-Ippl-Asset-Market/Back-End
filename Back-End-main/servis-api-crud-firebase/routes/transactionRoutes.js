import express from "express";
import { createTransactionController, saveBuyAssetsController } from "../controllers/transactionController.js";

const router = express.Router();

router.post("/transactions/create-transaction", createTransactionController);

router.post("/transactions/save-buy-assets", saveBuyAssetsController);

export default router;
