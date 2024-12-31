// controller/userController.js
import { db, auth, storage } from "../config/firebaseConfig.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Setup multer
const upload = multer({ storage: multer.memoryStorage() });


export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let userData;
    let role;
    let uid;
    let userId;
    const adminRef = db.collection("admins").where("email", "==", email);
    const adminSnapshot = await adminRef.get();

    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      userData = adminDoc.data();
      role = userData.role;
      uid = userData.uid;
      userId = userData.uid;
      // console.log("Admin ditemukan, UID:", uid); 
    } else {
      const userRef = db.collection("users").where("email", "==", email);
      const userSnapshot = await userRef.get();

      if (userSnapshot.empty) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan" });
      }

      const userDoc = userSnapshot.docs[0];
      userData = userDoc.data();
      role = "user";
      uid = userData.uid;
      userId = userData.uid;
      // console.log("Pengguna ditemukan, UID:", uid); 
    }
    // console.log("UID yang digunakan untuk token:", uid);
    const token = jwt.sign(
      {
        email: userData.email,
        role: role,
        uid: uid,
        userId: userId,
        name: userData.firstName + " " + userData.lastName,
        image: userData.photoURL || userData.profileImageUrl,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.status(200).json({
      token: token,
      user: {
        email: userData.email,
        role,
        uid,
        userId,
        name: userData.firstName + " " + userData.lastName,
        image: userData.photoURL || userData.profileImageUrl,
      },
    });
  } catch (error) {
    console.error("Error saat login:", error);
    res.status(500).json({ error: "Kesalahan Internal Server" });
  }
};


// Ambil semua pengguna
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
    res.status(500).json({ error: "Kesalahan Internal Server" });
  }
};

// Buat pengguna
export const createUser = async (req, res) => {
  const {
    uid,
    firstName,
    lastName,
    email,
    username,
    password,
    role = "user",
  } = req.body; // Default role adalah "user"

  try {
    const newUser = {
      uid,
      firstName,
      lastName,
      email,
      username,
      password,
      profileImageUrl: req.file ? null : "default_profile_image_url",
      role, // Sertakan role di sini
      createdAt: new Date(),
    };
    const userRef = await db.collection("users").add(newUser);
    res.status(201).json({ id: userRef.id, ...newUser });
  } catch (error) {
    console.error("Error saat membuat pengguna:", error);
    res.status(500).json({ error: "Kesalahan Internal Server" });
  }
};

// Ambil pengguna berdasarkan ID
export const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const userRef = db.collection("users").doc(id);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Kesalahan Internal Server" });
  }
};

// Update pengguna
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const {
    uid,
    firstName,
    lastName,
    email,
    username,
    password,
    oldProfileImageUrl,
  } = req.body;
  const file = req.file;
  let profileImageUrl;

  try {
    const updateData = {
      firstName,
      lastName,
      email,
      username,
    };

    // Hapus nilai undefined dari updateData
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Update di Firestore (tanpa menyimpan password)
    await db.collection("users").doc(id).update(updateData);

    // Data untuk update di Firebase Auth
    const authUpdateData = {
      email,
      displayName: `${firstName} ${lastName}`,
    };

    if (password) {
      authUpdateData.password = password;
    }

    // Update di Firebase Auth
    await auth.updateUser(uid, authUpdateData);

    // Jika ada file yang di-upload, simpan di Storage dan update URL di Firestore
    if (file) {
      const bucket = storage.bucket();
      const fileName = `${uuidv4()}_${file.originalname}`;
      const fileUpload = bucket.file(`images-user/${fileName}`);

      // Upload file
      await fileUpload.save(file.buffer, {
        contentType: file.mimetype,
        resumable: false,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
      });

      // Dapatkan URL download dengan token
      const [metadata] = await fileUpload.getMetadata();
      const token = metadata.metadata.firebaseStorageDownloadTokens;
      profileImageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name
        }/o/${encodeURIComponent(fileUpload.name)}?alt=media&token=${token}`;

      // Update URL gambar di Firestore
      await db.collection("users").doc(id).update({ profileImageUrl });

      // Hapus gambar lama dari Storage jika ada
      if (oldProfileImageUrl) {
        const oldFileName = decodeURIComponent(
          oldProfileImageUrl.split("/").pop().split("?")[0].split("%2F")[1]
        ); // Ambil nama file dari URL
        const oldFilePath = `images-user/${oldFileName}`;
        await bucket.file(oldFilePath).delete();
      }
    }

    res.status(200).json({
      id,
      ...updateData,
      profileImageUrl: file ? profileImageUrl : oldProfileImageUrl,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ error: "Kesalahan Internal Server", details: error.message });
  }
};

// Hapus pengguna
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan" });
    }

    const userData = userDoc.data();
    const uid = userData.uid;
    const profileImageUrl = userData.profileImageUrl;

    // Cek keberadaan pengguna di Firebase Authentication
    try {
      const userRecord = await auth.getUser(uid);
      await auth.deleteUser(uid);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
      } else {
        return res
          .status(500)
          .json({ error: "Kesalahan Internal Server", details: err.message });
      }
    }

    // Hapus gambar dari Firebase Storage jika ada
    if (profileImageUrl) {
      const bucket = storage.bucket();
      const fileName = decodeURIComponent(
        profileImageUrl.split("/").pop().split("?")[0].split("%2F")[1]
      );
      const filePath = `images-user/${fileName}`;

      try {
        await bucket.file(filePath).delete();
      } catch (err) { }
    }

    await userRef.delete();

    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ error: "Kesalahan Internal Server", details: error.message });
  }
};
