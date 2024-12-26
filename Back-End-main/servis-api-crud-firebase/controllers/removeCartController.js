import { db } from "../config/firebaseConfig.js";

export const removeCart = async (req, res) => {
  const { docId } = req.params; // Ambil ID dokumen dari parameter permintaan
  if (!docId) {
    console.log("Error: docId diperlukan");
    return res.status(400).json({ error: "docId diperlukan" });
  }

  try {
    // Referensi dokumen di removeCart
    const removeCartDocRef = db.collection("cartAssets").doc(docId);
    const removeCartDoc = await removeCartDocRef.get();

    if (removeCartDoc.exists) {
      // Hapus dokumen dari removeCart
      await removeCartDocRef.delete();
      console.log(`Success: Dokumen dengan docId ${docId} berhasil dihapus dari removeCart.`);
      return res.status(200).json({
        message: "Dokumen berhasil dihapus dari removeCart.",
      });
    } else {
      console.log(`Error: Dokumen tidak ditemukan di removeCart untuk docId: ${docId}`);
      return res.status(404).json({ error: "Dokumen tidak ditemukan di removeCart" });
    }
  } catch (error) {
    console.error("Kesalahan saat menghapus dokumen:", error);
    return res.status(500).json({ error: "Kesalahan Server Internal" });
  }
};
