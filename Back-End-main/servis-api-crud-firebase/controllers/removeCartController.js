import { db } from "../config/firebaseConfig.js";

export const removeCart = async (req, res) => {
  const { docId } = req.params; // Ambil ID dokumen dari parameter permintaan
  console.log(`Memulai removeCart dengan docId: ${docId}`); // Log awal

  if (!docId) {
    console.log("Error: docId diperlukan");
    return res.status(400).json({ error: "docId diperlukan" });
  }

  try {
    console.log(`Mencari dokumen dengan assetId: ${docId}`); // Log pencarian dokumen
    // Mencari dokumen berdasarkan assetId yang sama dengan docId
    const cartAssetsRef = db.collection("cartAssets");
    const querySnapshot = await cartAssetsRef.where("assetId", "==", docId).get();

    if (!querySnapshot.empty) {
      console.log(`Dokumen ditemukan untuk assetId: ${docId}. Menghapus dokumen...`); // Log dokumen ditemukan
      // Jika dokumen ditemukan, hapus semua dokumen yang cocok
      const batch = db.batch();
      querySnapshot.forEach((doc) => {
        console.log(`Menandai dokumen untuk dihapus: ${doc.id}`); // Log dokumen yang akan dihapus
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Success: Dokumen dengan assetId ${docId} berhasil dihapus dari removeCart.`);
      return res.status(200).json({
        message: "Dokumen berhasil dihapus dari removeCart.",
      });
    } else {
      console.log(`Error: Dokumen tidak ditemukan di removeCart untuk assetId: ${docId}`);
      return res.status(404).json({ error: "Dokumen tidak ditemukan di removeCart" });
    }
  } catch (error) {
    console.error("Kesalahan saat menghapus dokumen:", error); // Log kesalahan
    return res.status(500).json({ error: "Kesalahan Server Internal" });
  }
};
