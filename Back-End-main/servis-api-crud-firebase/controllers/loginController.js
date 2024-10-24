import { auth, db } from "../config/firebaseConfig.js";

// Controller untuk menangani login
const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifikasi email pengguna dengan Firebase Admin
    const userRecord = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(userRecord.uid);

    // Cek role dari koleksi 'admins'
    const adminSnapshot = await db
      .collection("admins")
      .where("email", "==", email)
      .get();

    let role = "user"; // Default role

    if (!adminSnapshot.empty) {
      const adminData = adminSnapshot.docs[0].data();
      role = adminData.role; // Mendapatkan role dari koleksi 'admins'
    } else {
      // Jika tidak ditemukan di 'admins', cek di koleksi 'users'
      const userSnapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        role = userData.role || "user"; // Mendapatkan role dari koleksi 'users'
      }
    }

    // Respon sukses dengan custom token dan role
    res.status(200).json({
      message: "Login successful",
      token: customToken,
      role: role,
    });
  } catch (error) {
    // Jika ada kesalahan, kembalikan error
    res.status(400).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

export default loginController;