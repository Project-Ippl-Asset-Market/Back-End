import { auth } from "../config/firebaseConfig.js";

// Fungsi untuk memeriksa apakah email terdaftar
export const checkEmail = async (req, res) => {
  const { email } = req.body || req.query;

  if (!email) {
    return res.status(400).json({ message: "Email tidak boleh kosong." });
  }

  try {
    const userRecord = await auth.getUserByEmail(email);
    return res.status(200).json({ message: "Email ditemukan.", userRecord });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return res.status(404).json({ message: "Email tidak terdaftar." });
    }
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan. Silakan coba lagi." });
  }
};

// Fungsi untuk memeriksa apakah email terdaftar dengan metode POST
export const checkEmailPost = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email tidak boleh kosong." });
  }

  try {
    const userRecord = await auth.getUserByEmail(email);
    return res.status(200).json({ message: "Email ditemukan.", userRecord });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return res.status(404).json({ message: "Email tidak terdaftar." });
    }
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan. Silakan coba lagi." });
  }
};
