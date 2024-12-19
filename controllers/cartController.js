import { db } from "../config/firebaseConfig.js";

// Fungsi untuk menambahkan aset ke dalam keranjang
export const addToCartController = async (req, res) => {
  const { assetId } = req.body;

  // console.log("Mencoba menambahkan aset ke keranjang:");
  // console.log("Asset ID:", assetId);

  try {
    const cartDoc = await db.collection("cartAssets").doc(assetId).get();

    if (cartDoc.exists) {
      return res.status(400).json({
        message: "Aset sudah ada di keranjang.",
      });
    }

    const assetDoc = await db.collection("assets").doc(assetId).get();

    if (!assetDoc.exists) {
      return res.status(404).json({
        message: "Aset tidak ditemukan.",
      });
    }

    const assetData = assetDoc.data();
    const assetOwnerId = assetData.userId;

    const userId = req.userId;

    if (userId === assetOwnerId) {
      return res.status(403).json({
        message:
          "Anda tidak dapat menambahkan aset milik Anda sendiri ke dalam keranjang.",
      });
    }

    await db.collection("cartAssets").doc(assetId).set({
      assetId,
      addedBy: userId,
      ownerId: assetOwnerId,
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
