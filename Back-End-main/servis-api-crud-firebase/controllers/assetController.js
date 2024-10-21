import { db } from "../config/firebaseConfig.js";

// Function to view asset by assetId
export const getAssetByIdController = async (req, res) => {
  const { assetId } = req.params;   

  try {
    // Fetch asset by assetId
    const assetDoc = await db.collection("cartAssets").doc(assetId).get();

    if (!assetDoc.exists) {
      return res.status(404).json({ message: "Asset tidak ditemukan" });
    }

    const assetData = assetDoc.data();

    // Return response with asset data
    res.status(200).json(assetData);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil asset",
      error: error.message,
    });
  }
};

export const moveAssetsController = async (req, res) => {
  const { uid, assets } = req.body; 

  // Validate input
  if (!uid || !Array.isArray(assets) || assets.length === 0) {
    return res
      .status(400)
      .json({ message: "Invalid input: uid and assets are required." });
  }

  try {
    const batch = db.batch();

    // Move each asset to buyAssets and delete from cartAssets
    for (const asset of assets) {
      // Validate that each asset has an assetId
      if (!asset.assetId) {
        return res.status(400).json({
          message: `Invalid asset: ${JSON.stringify(
            asset
          )} does not have assetId.`,
        });
      }

      // Cek apakah aset sudah dibeli
      const boughtAssetDoc = await db
        .collection("buyAssets")
        .doc(asset.assetId)
        .get();

      if (boughtAssetDoc.exists) {
        return res.status(400).json({
          message: `Aset ${asset.assetId} sudah dibeli dan tidak bisa dipindahkan ke buyAssets lagi.`,
        });
      }

      const assetRef = db.collection("cartAssets").doc(asset.assetId);
      const buyAssetRef = db.collection("buyAssets").doc(asset.assetId); 

      // Create the asset document in buyAssets with price 0 and include buyer's UID
      batch.set(buyAssetRef, {
        ...asset,
        price: 0, 
        boughtBy: uid, 
        createdAt: new Date(), 
      });

      // Delete the asset from the cartAssets collection
      batch.delete(assetRef); 
    }

    await batch.commit(); 
    res
      .status(200)
      .json({ message: "Assets successfully moved to buyAssets." });
  } catch (error) {
    console.error("Error moving assets:", error);
    res.status(500).json({
      message: "Error moving assets. Please try again.",
      error: error.message,
    });
  }
};
