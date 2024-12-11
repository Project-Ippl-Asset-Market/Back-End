import { db } from "../config/firebaseConfig.js";

export const checkAssetByUid = async (req, res) => {
  const { uid, assetId } = req.body;

  if (!uid || !assetId) {
    return res.status(400).json({
      message: "Input tidak valid: UID dan assetId harus disediakan.",
    });
  }

  try {
    const assetCollections = [
      "assetAudios",
      "assetImages",
      "assetDatasets",
      "assetImage2D",
      "assetImage3D",
      "assetVideos",
    ];

    let isAssetOwner = false;
    let assetFound = false;

    for (const collection of assetCollections) {
      const assetDoc = await db.collection(collection).doc(assetId).get();
      if (assetDoc.exists) {
        assetFound = true;
        const assetOwnerUid = assetDoc.data().uid;
        if (assetOwnerUid === uid) {
          isAssetOwner = true;
        }
        break;
      }
    }

    if (!assetFound) {
      return res.status(404).json({
        message: "Aset tidak ditemukan.",
      });
    }

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
