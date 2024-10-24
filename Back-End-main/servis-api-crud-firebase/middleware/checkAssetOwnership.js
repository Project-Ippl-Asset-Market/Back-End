// middlewares/checkAssetOwnership.js
import { db } from "../config/firebaseConfig.js";

// Middleware untuk memeriksa apakah pengguna adalah pemilik aset
export const checkAssetOwnership = async (req, res, next) => {
  const { uid, assetId } = req.body;

  // Validasi input
  if (!uid || !assetId) {
    return res.status(400).json({
      message: "Input tidak valid: UID dan assetId harus disediakan.",
    });
  }

  try {
    let assetExists = false; // Flag untuk memeriksa apakah aset ada
    let assetOwnerId = null; // Menyimpan UID pemilik aset

    // Periksa aset di koleksi yang relevan
    const assetCollections = [
      "assetAudios",
      "assetImages",
      "assetDatasets",
      "assetImage2D",
      "assetImage3D",
      "assetVideos",
    ];

    // Iterasi setiap koleksi untuk menemukan aset
    for (const collection of assetCollections) {
      const assetDoc = await db.collection(collection).doc(assetId).get();
      if (assetDoc.exists) {
        assetExists = true;
        const assetData = assetDoc.data();
        assetOwnerId = assetData.ownerId; // Mengganti dari uid ke ownerId
        console.log(`Aset ditemukan! UID pemilik: ${assetOwnerId}`);
        break; // Berhenti mencari setelah menemukan aset
      }
    }

    // Jika aset tidak ditemukan, kembalikan error
    if (!assetExists) {
      return res.status(404).json({
        message: "Aset tidak ditemukan di koleksi yang relevan.",
      });
    }

    // Periksa apakah UID yang diberikan cocok dengan UID pemilik aset
    if (assetOwnerId === uid) {
      console.log(
        `Pengguna dengan UID ${uid} adalah pemilik aset (ID Aset: ${assetId}).`
      );
      return res.status(403).json({
        message: `Aksi tidak valid: Anda tidak dapat membeli aset yang Anda upload (ID Aset: ${assetId}).`,
      });
    } else {
      console.log(
        `Pengguna dengan UID ${uid} bukan pemilik aset (ID Aset: ${assetId}).`
      );
    }

    // Lanjutkan ke middleware/controller berikutnya jika semua pengecekan berhasil
    next();
  } catch (error) {
    console.error("Error saat memeriksa kepemilikan aset:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat memeriksa kepemilikan aset.",
      error: error.message,
    });
  }
};
