import { db } from "../config/firebaseConfig.js";

// Fungsi untuk menambahkan aset ke dalam keranjang
export const addToCartController = async (req, res) => {
  const { assetId } = req.body; // Mengambil assetId dari body permintaan

  console.log("Mencoba menambahkan aset ke keranjang:");
  console.log("Asset ID:", assetId);

  try {
    // Cek apakah aset sudah ada di keranjang
    const cartDoc = await db.collection("cartAssets").doc(assetId).get();

    if (cartDoc.exists) {
      return res.status(400).json({
        message: "Aset sudah ada di keranjang.",
      });
    }

    // Ambil data aset untuk memeriksa kepemilikan
    const assetDoc = await db.collection("assets").doc(assetId).get();

    if (!assetDoc.exists) {
      return res.status(404).json({
        message: "Aset tidak ditemukan.",
      });
    }

    const assetData = assetDoc.data();
    const assetOwnerId = assetData.userId; // Gunakan userId sebagai pemilik asli aset

    // Asumsikan req.userId diisi oleh middleware otentikasi sebelumnya
    const userId = req.userId; // Mengambil ID pengguna dari sesi atau token

    // Cek apakah pengguna yang menambahkan adalah pemilik aset
    if (userId === assetOwnerId) {
      return res.status(403).json({
        message:
          "Anda tidak dapat menambahkan aset milik Anda sendiri ke dalam keranjang.",
      });
    }

    // Tambahkan aset ke dalam keranjang dengan informasi userId lama (pemilik asli)
    await db.collection("cartAssets").doc(assetId).set({
      assetId,
      addedBy: userId,
      ownerId: assetOwnerId, // Menyimpan userId lama pemilik asli
      createdAt: new Date(),
    });

    res.status(200).json({
      message: "Aset berhasil ditambahkan ke keranjang.",
    });
  } catch (error) {
    console.error("Error menambahkan aset ke keranjang:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat menambahkan aset ke keranjang.",
      error: error.message,
    });
  }
};
