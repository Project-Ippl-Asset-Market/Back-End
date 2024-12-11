import express from "express";
import {
  getAssetByIdController,
  moveAssetsController,
  deleteAssetByIdController,
  deleteAssetFromCartBuyNow,
} from "../controllers/assetController.js";

const router = express.Router();

router.get("/:assetId", getAssetByIdController);
router.post("/move-assets", moveAssetsController);
router.delete("/delete/:docId", deleteAssetByIdController);
// Route to delete asset from cartAssets
// router.delete("/delete/cart-assets/:docId", deleteAssetFromCartAssets);
router.delete("/delete/:docId", deleteAssetFromCartBuyNow);

export default router;
