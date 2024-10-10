import { db, auth } from "../config/firebaseConfig.js";
import { getStorage } from "firebase-admin/storage";
import multer from "multer"; // Tambahkan import multer
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";

// Inisialisasi storage
const storage = new Storage();
const bucket = storage.bucket("my-asset-market.appspot.com");
const upload = multer({ storage: multer.memoryStorage() });

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create user
export const createUser = async (req, res) => {
  const { email, firstName, lastName, profileImageUrl, role, uid, username } =
    req.body;
  if (!role) return res.status(400).json({ error: "Role is required" });

  try {
    const newUser = {
      email,
      firstName,
      lastName,
      profileImageUrl,
      role,
      uid,
      username,
      createdAt: new Date(),
    };
    const userRef = await db.collection("users").add(newUser);
    res.status(201).json({ id: userRef.id, ...newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const userRef = db.collection("users").doc(id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update user
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    uid,
    email,
    firstName,
    lastName,
    role,
    username,
    oldProfileImageUrl,
  } = req.body;
  const file = req.file; // Ambil file dari req.file
  let profileImageUrl; // Inisialisasi variabel profileImageUrl

  try {
    const updateData = {
      email,
      firstName,
      lastName,
      role,
      username,
    };

    // Hapus nilai undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Update di Firestore
    await db.collection("users").doc(id).update(updateData);
    console.log(`User dengan ID ${id} berhasil diperbarui di Firestore.`);

    // Update di Firebase Auth
    await auth.updateUser(uid, {
      email,
      displayName: `${firstName} ${lastName}`,
    });
    console.log(
      `Pengguna dengan UID ${uid} berhasil diperbarui di Firebase Auth.`
    );

    // Jika ada file yang di-upload, simpan di Storage dan update URL di Firestore
    if (file) {
      const fileName = `${uuidv4()}_${file.originalname}`; // Buat nama file unik
      const fileUpload = bucket.file(`images-users/${fileName}`); // Ganti dengan path yang sesuai

      // Upload file
      await fileUpload.save(file.buffer, {
        contentType: file.mimetype,
        resumable: false,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(), // Tambahkan token akses
          },
        },
      });

      // Dapatkan URL download dengan token
      const [metadata] = await fileUpload.getMetadata(); // Ambil metadata file
      const token = metadata.metadata.firebaseStorageDownloadTokens;
      profileImageUrl = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURIComponent(fileUpload.name)}?alt=media&token=${token}`;

      // Update URL gambar di Firestore
      await db.collection("users").doc(id).update({ profileImageUrl });
      console.log(`URL gambar diperbarui di Firestore: ${profileImageUrl}`);

      // Hapus gambar lama dari Storage jika ada
      if (oldProfileImageUrl) {
        const oldFileName = decodeURIComponent(
          oldProfileImageUrl.split("/").pop().split("?")[0].split("%2F")[1]
        ); // Ambil nama file dari URL
        const oldFilePath = `images-users/${oldFileName}`; // Path ke gambar lama
        await bucket.file(oldFilePath).delete(); // Hapus gambar lama
        console.log(
          `Gambar lama berhasil dihapus dari Storage: ${oldFilePath}`
        );
      }
    }

    res.status(200).json({
      id,
      ...updateData,
      profileImageUrl: file ? profileImageUrl : oldProfileImageUrl, // Kembalikan URL gambar baru jika ada
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Ambil data user dari Firestore untuk mendapatkan UID
    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const uid = userData.uid; // Ambil UID dari data user

    // Hapus pengguna dari Firebase Authentication
    await auth.deleteUser(uid);
    console.log(`User with UID ${uid} deleted from Firebase Auth.`);

    // Hapus user dari Firestore
    await userRef.delete();
    console.log(`User with ID ${id} has been deleted from Firestore.`);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error); // Log detail kesalahan
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};
