// routes/cartRoutes.js
import express from "express";
import { addToCartController } from "../controllers/cartController.js";
import { checkAssetOwnership } from "../middleware/checkAssetOwnership.js";

const router = express.Router();

// Route untuk menambahkan aset ke keranjang dengan middleware untuk mengecek kepemilikan
router.post("/add-to-cart", checkAssetOwnership, addToCartController);

export default router;
