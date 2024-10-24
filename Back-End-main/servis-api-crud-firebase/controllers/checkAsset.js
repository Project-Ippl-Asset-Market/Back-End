// controllers/checkAsset.js
import { db } from "../config/firebaseConfig.js";

// Function to check asset ownership based on UID and asset ID
export const checkAssetByUid = async (req, res) => {
  const { uid, assetId } = req.body;

  // Validate input
  if (!uid || !assetId) {
    return res.status(400).json({
      message: "Input tidak valid: UID dan assetId harus disediakan.",
    });
  }

  try {
    // Collections to check for the asset
    const assetCollections = [
      "assetAudios",
      "assetImages",
      "assetDatasets",
      "assetImage2D",
      "assetImage3D",
      "assetVideos",
    ];

    // Initialize variables to track asset ownership and existence
    let isAssetOwner = false;
    let assetFound = false;

    // Check in each collection for the asset
    for (const collection of assetCollections) {
      const assetDoc = await db.collection(collection).doc(assetId).get();
      if (assetDoc.exists) {
        assetFound = true; // Mark asset as found
        const assetOwnerUid = assetDoc.data().uid; // Get the UID of the asset owner
        if (assetOwnerUid === uid) {
          isAssetOwner = true; // Mark the user as the owner of the asset
        }
        break; // Stop searching once we find the asset
      }
    }

    // Asset not found
    if (!assetFound) {
      return res.status(404).json({
        message: "Aset tidak ditemukan.",
      });
    }

    // Check ownership and respond accordingly
    if (isAssetOwner) {
      return res.status(200).json({
        message: "Anda adalah pemilik aset.",
      });
    } else {
      return res.status(403).json({
        message: "Anda bukan pemilik aset.",
      });
    }
  } catch (error) {
    console.error("Error checking asset ownership:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat memeriksa kepemilikan aset.",
      error: error.message,
    });
  }
};
