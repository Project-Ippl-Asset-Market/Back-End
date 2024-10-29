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

// export const moveAssetsController = async (req, res) => {
//   const { uid, assets } = req.body;

//   // Validate input
//   if (!uid || !Array.isArray(assets) || assets.length === 0) {
//     return res.status(400).json({
//       message: "Invalid input: uid and assets are required.",
//     });
//   }

//   try {
//     const batch = db.batch();

//     for (const asset of assets) {
//       // Validate assetId
//       if (!asset.assetId) {
//         return res.status(400).json({
//           message: `Invalid asset: ${JSON.stringify(
//             asset
//           )} does not have assetId.`,
//         });
//       }

//       // Check if asset has been already purchased
//       const boughtAssetDoc = await db
//         .collection("buyAssets")
//         .doc(asset.assetId)
//         .get();

//       if (boughtAssetDoc.exists) {
//         console.log(
//           `Asset ${asset.assetId} has already been purchased. Deleting from cartAssets.`
//         );
//         const assetRef = db.collection("cartAssets").doc(asset.assetId);
//         batch.delete(assetRef); // Delete from cart
//         continue;
//       }

//       // Proceed if asset is not purchased
//       console.log(`Processing asset ${asset.assetId} for purchase.`);
//       const assetRef = db.collection("cartAssets").doc(asset.assetId);
//       const buyAssetRef = db.collection("buyAssets").doc(asset.assetId);

//       // Add asset to buyAssets and delete from cartAssets
//       batch.set(buyAssetRef, {
//         assetId: asset.assetId,
//         price: asset.price || 0,
//         boughtBy: uid,
//         createdAt: new Date(),
//       });

//       // Schedule deletion of the asset from cartAssets collection
//       batch.delete(assetRef);
//     }

//     await batch.commit();
//     console.log("Batch operation committed successfully.");

//     res.status(200).json({
//       message:
//         "Assets successfully moved to buyAssets and deleted from cartAssets.",
//     });
//   } catch (error) {
//     console.error("Error moving assets:", error);
//     res.status(500).json({
//       message: "Error moving assets. Please try again.",
//       error: error.message,
//     });
//   }
// };

// Fungsi untuk memindahkan aset
export const moveAssetsController = async (req, res) => {
  const { uid, assets } = req.body;

  // Validasi input
  if (!uid || !Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({
      message: "Invalid input: uid and assets are required.",
    });
  }

  try {
    const batch = db.batch();

    for (const asset of assets) {
      // Validasi assetId
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
        console.log(
          `Asset ${asset.assetId} has already been purchased. Deleting from cartAssets.`
        );
        const assetRef = db.collection("cartAssets").doc(asset.assetId);
        batch.delete(assetRef); // Hapus dari cart
        continue;
      }

      // Lanjutkan jika aset belum dibeli
      console.log(`Processing asset ${asset.assetId} for purchase.`);
      const assetRef = db.collection("cartAssets").doc(asset.assetId);
      const buyAssetRef = db.collection("buyAssets").doc(asset.assetId);

      // Tambahkan aset ke buyAssets
      batch.set(buyAssetRef, {
        assetId: asset.assetId,
        price: asset.price || 0,
        boughtBy: uid,
        createdAt: new Date(),
      });

      // Hapus aset dari cartAssets
      batch.delete(assetRef);
    }

    // Komit semua perubahan dalam batch
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

// Controller to delete asset by ID from cartAssets
export const deleteAssetByIdController = async (req, res) => {
  const { docId } = req.params;

  try {
    const assetRef = db.collection("cartAssets").doc(docId);
    const assetDoc = await assetRef.get();

    if (!assetDoc.exists) {
      return res
        .status(404)
        .json({ message: "Asset tidak ditemukan di cartAssets" });
    }

    // Hapus asset dari cartAssets
    await assetRef.delete();
    console.log(
      `Successfully deleted asset from cartAssets with docId: ${docId}`
    );

    res.status(200).json({ message: "Asset berhasil dihapus dari cartAssets" });
  } catch (error) {
    console.error("Error deleting asset from cartAssets:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menghapus asset dari cartAssets",
      error: error.message,
    });
  }
};

// Controller to delete asset by ID from cartBuyNow
export const deleteAssetFromCartBuyNow = async (req, res) => {
  const { docId } = req.params;

  try {
    const cartBuyNowRef = db.collection("buyNow").doc(docId);
    const cartDoc = await cartBuyNowRef.get();

    if (!cartDoc.exists) {
      return res
        .status(404)
        .json({ message: "Asset tidak ditemukan di buyNow" });
    }

    // Hapus asset dari cartBuyNow
    await cartBuyNowRef.delete();
    console.log(
      `Successfully deleted asset from cartBuyNow with docId: ${docId}`
    );

    res.status(200).json({ message: "Asset berhasil dihapus dari buyNow" });
  } catch (error) {
    console.error("Error deleting asset from cartBuyNow:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menghapus asset dari buyNow",
      error: error.message,
    });
  }
};
