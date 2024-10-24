import { db } from "../config/firebaseConfig.js";

// Function to view asset by assetId
export const getAssetByIdController = async (req, res) => {
  const { assetId } = req.params;

  try {
    const assetDoc = await db.collection("cartAssets").doc(assetId).get();

    if (!assetDoc.exists) {
      return res.status(404).json({ message: "Asset tidak ditemukan" });
    }

    const assetData = assetDoc.data();

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
    return res.status(400).json({
      message: "Invalid input: uid and assets are required.",
    });
  }

  try {
    const batch = db.batch();

    for (const asset of assets) {
      // Validate assetId
      if (!asset.assetId) {
        return res.status(400).json({
          message: `Invalid asset: ${JSON.stringify(
            asset
          )} does not have assetId.`,
        });
      }

      // Check if asset has been already purchased
      const boughtAssetDoc = await db
        .collection("buyAssets")
        .doc(asset.assetId)
        .get();

      if (boughtAssetDoc.exists) {
        console.log(
          `Asset ${asset.assetId} has already been purchased. Deleting from cartAssets.`
        );
        const assetRef = db.collection("cartAssets").doc(asset.assetId);
        batch.delete(assetRef); // Delete from cart
        continue;
      }

      // Proceed if asset is not purchased
      console.log(`Processing asset ${asset.assetId} for purchase.`);
      const assetRef = db.collection("cartAssets").doc(asset.assetId);
      const buyAssetRef = db.collection("buyAssets").doc(asset.assetId);

      // Add asset to buyAssets and delete from cartAssets
      batch.set(buyAssetRef, {
        assetId: asset.assetId,
        price: asset.price || 0,
        boughtBy: uid,
        createdAt: new Date(),
      });

      // Schedule deletion of the asset from cartAssets collection
      batch.delete(assetRef);
    }

    await batch.commit();
    console.log("Batch operation committed successfully.");

    res.status(200).json({
      message:
        "Assets successfully moved to buyAssets and deleted from cartAssets.",
    });
  } catch (error) {
    console.error("Error moving assets:", error);
    res.status(500).json({
      message: "Error moving assets. Please try again.",
      error: error.message,
    });
  }
};

// Function to delete asset by assetId
export const deleteAssetByIdController = async (req, res) => {
  const { assetId } = req.params;

  try {
    const assetRef = db.collection("cartAssets").doc(assetId);
    const assetDoc = await assetRef.get();

    if (!assetDoc.exists) {
      return res.status(404).json({ message: "Asset tidak ditemukan" });
    }

    await assetRef.delete();

    res.status(200).json({ message: "Asset berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menghapus asset",
      error: error.message,
    });
  }
};
