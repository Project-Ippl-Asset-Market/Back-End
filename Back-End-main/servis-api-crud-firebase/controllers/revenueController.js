import { db } from "../config/firebaseConfig.js";
import { doc, setDoc } from "firebase/firestore";

// Fungsi untuk menyimpan total pendapatan
export const saveTotalRevenue = async (req, res) => {
  const { ownerId, username, totalPendapatan } = req.body;

  try {
    // Simpan total pendapatan ke koleksi revenue
    await setDoc(doc(db, "revenue", ownerId), {
      username: username,
      totalPendapatan: totalPendapatan,
    });

    console.log(
      `Total pendapatan untuk ${username} berhasil disimpan: Rp. ${totalPendapatan}`
    );
    res.status(200).json({ message: "Total pendapatan berhasil disimpan" });
  } catch (error) {
    console.error("Error saving total revenue:", error);
    res
      .status(500)
      .json({ message: "Error saving total revenue", error: error.message });
  }
};