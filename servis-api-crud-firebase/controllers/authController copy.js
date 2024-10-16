import { auth } from "../config/firebaseConfig.js";

// Fungsi untuk memeriksa apakah email terdaftar
export const checkEmail = async (req, res) => {
  const { email } = req.body;

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

// Fungsi untuk mengatur pemulihan kata sandi
export const resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const link = await auth.generatePasswordResetLink(email);
    return res
      .status(200)
      .json({ message: "Link pemulihan telah dikirim ke email Anda.", link });
  } catch (error) {
    console.error("Kesalahan saat menghasilkan tautan pemulihan:", error);
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan. Silakan coba lagi." });
  }
};
