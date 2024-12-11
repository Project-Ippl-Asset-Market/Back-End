import { db } from "../config/firebaseConfig.js";

export const moveAsset = async (req, res) => {
  const { docId } = req.params;
  if (!docId) {
    return res.status(400).json({ error: "docId diperlukan" });
  }

  try {
    const buyNowDocRef = db.collection("buyNow").doc(docId);
    const buyNowDoc = await buyNowDocRef.get();
    if (buyNowDoc.exists) {
      const buyNowData = buyNowDoc.data();
      await buyNowDocRef.update({ status: "completed" });

      const buyAssetsDocRef = db.collection("buyAssets").doc();
      await buyAssetsDocRef.set({
        ...buyNowData,
        status: "success",
        movedAt: new Date().toISOString(),
      });

      await buyNowDocRef.delete();
    } else {
      console.log("Dokumen tidak ditemukan di buyNow, mencoba cartAssets.");
    }

    const cartAssetsDocRef = db.collection("cartAssets").doc(docId);
    const cartAssetsDoc = await cartAssetsDocRef.get();
    if (!cartAssetsDoc.exists) {
      return res
        .status(404)
        .json({ error: "Dokumen tidak ditemukan di cartAssets" });
    }

    const cartAssetsData = cartAssetsDoc.data();
    await cartAssetsDocRef.update({ status: "completed" });

    const cartAssetsBuyRef = db.collection("buyAssets").doc();
    await cartAssetsBuyRef.set({
      ...cartAssetsData,
      status: "success",
      movedAt: new Date().toISOString(),
    });

    await cartAssetsDocRef.delete();

    return res.status(200).json({
      message:
        "Transaksi berhasil diselesaikan, data dipindahkan ke buyAssets dari buyNow dan cartAssets, dan dokumen dihapus dari keduanya",
    });
  } catch (error) {
    console.error("Kesalahan saat menyelesaikan transaksi:", error);
    return res.status(500).json({ error: "Kesalahan Server Internal" });
  }
};
