// /routes/assetRoutes.js
import express from "express";
import {
  getAssetByIdController,
  moveAssetsController,
  deleteAssetByIdController,
  deleteAssetFromCartBuyNow,
} from "../controllers/assetController.js";

const router = express.Router();

// Route to get asset by ID
router.get("/:assetId", getAssetByIdController);

// Route to move assets after payment
router.post("/move-assets", moveAssetsController);

// Route to delete asset by ID
router.delete("/delete/:docId", deleteAssetByIdController);

// Route to delete asset from cartAssets
// router.delete("/delete/cart-assets/:docId", deleteAssetFromCartAssets);

// Route to delete asset from cartBuyNow
router.delete("/delete/:docId", deleteAssetFromCartBuyNow);

export default router;
