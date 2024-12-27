import { db, auth } from "../config/firebaseConfig.js";

export const moveAsset = async (req, res) => {
  // Ambil token dari header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Error: Token otorisasi tidak ditemukan");
    return res.status(401).json({ error: "Token otorisasi tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1]; // Ambil token setelah "Bearer"

  try {
    // Verifikasi token menggunakan Firebase Authentication
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid; // Ambil uid dari token yang valid
    console.log("Token valid untuk uid:", userId);

    const { docId } = req.params; // Ambil ID dokumen dari parameter permintaan
    if (!docId) {
      console.log("Error: docId diperlukan");
      return res.status(400).json({ error: "docId diperlukan" });
    }

    // Cek dan pindahkan dari buyNow
    const buyNowDocRef = db.collection("buyNow").doc(docId);
    const buyNowDoc = await buyNowDocRef.get();

    if (buyNowDoc.exists) {
      const buyNowData = buyNowDoc.data();

      // Pastikan hanya pengguna yang sesuai dengan `userId` yang dapat memindahkan dokumen mereka
      if (buyNowData.userId !== userId) {
        console.log("Error: Tidak memiliki izin untuk memindahkan dokumen ini");
        return res.status(403).json({ error: "Tidak memiliki izin untuk memindahkan dokumen ini" });
      }

      // Update status menjadi "completed" sebelum memindahkan
      await buyNowDocRef.update({ status: "completed" });

      // Pindahkan data ke buyAssets
      const buyAssetsDocRef = db.collection("buyAssets").doc();
      await buyAssetsDocRef.set({
        ...buyNowData,
        status: "success",
        movedAt: new Date().toISOString(),
      });

      // Hapus dokumen dari buyNow setelah berhasil dipindahkan
      await buyNowDocRef.delete();
      console.log(`Success: Transaksi berhasil diselesaikan, data dipindahkan dari buyNow ke buyAssets untuk docId: ${docId}`);
      return res.status(200).json({
        message: "Transaksi berhasil diselesaikan, data dipindahkan dari buyNow ke buyAssets.",
      });
    }

    // Cek dan pindahkan dari cartAssets jika tidak ditemukan di buyNow
    const cartAssetsDocRef = db.collection("cartAssets").doc(docId);
    const cartAssetsDoc = await cartAssetsDocRef.get();

    if (cartAssetsDoc.exists) {
      const cartAssetsData = cartAssetsDoc.data();

      // Pastikan hanya pengguna yang sesuai dengan `userId` yang dapat memindahkan dokumen mereka
      if (cartAssetsData.userId !== userId) {
        console.log("Error: Tidak memiliki izin untuk memindahkan dokumen ini");
        return res.status(403).json({ error: "Tidak memiliki izin untuk memindahkan dokumen ini" });
      }

      await cartAssetsDocRef.update({ status: "completed" });

      const cartAssetsBuyRef = db.collection("buyAssets").doc();
      await cartAssetsBuyRef.set({
        ...cartAssetsData,
        status: "success",
        movedAt: new Date().toISOString(),
      });

      await cartAssetsDocRef.delete();
      console.log(`Success: Transaksi berhasil diselesaikan, data dipindahkan dari cartAssets ke buyAssets untuk docId: ${docId}`);
      return res.status(200).json({
        message: "Transaksi berhasil diselesaikan, data dipindahkan dari cartAssets ke buyAssets.",
      });
    } else {
      console.log(`Error: Dokumen tidak ditemukan di cartAssets untuk docId: ${docId}`);
      return res.status(404).json({ error: "Dokumen tidak ditemukan di cartAssets" });
    }
  } catch (error) {
    console.error("Kesalahan saat menyelesaikan transaksi:", error);
    return res.status(500).json({ error: "Kesalahan Server Internal" });
  }
};
