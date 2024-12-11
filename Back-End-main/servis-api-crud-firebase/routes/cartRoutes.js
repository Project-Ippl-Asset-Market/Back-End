import express from "express";
import { addToCartController } from "../controllers/cartController.js";
import { checkAssetOwnership } from "../middleware/checkAssetOwnership.js";

const router = express.Router();
router.post("/add-to-cart", checkAssetOwnership, addToCartController);

export default router;
