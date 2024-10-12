// import { db, auth } from "../config/firebaseConfig.js";
// import { getStorage } from "firebase-admin/storage";
// import multer from "multer";
// import { v4 as uuidv4 } from "uuid";

// // Setup multer
// const upload = multer({ storage: multer.memoryStorage() });

// // Get all users
// export const getAllUsers = async (req, res) => {
//   try {
//     const snapshot = await db.collection("users").get();
//     const users = [];
//     snapshot.forEach((doc) => {
//       users.push({ id: doc.id, ...doc.data() });
//     });
//     res.json(users);
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// // Create user
// export const createUser = async (req, res) => {
//   const { uid, firstName, lastName, email, username, password } = req.body;

//   try {
//     const newUser = {
//       uid,
//       firstName,
//       lastName,
//       email,
//       username,
//       password,
//       profileImageUrl: req.file ? null : "default_profile_image_url", // Gunakan URL default jika tidak ada gambar
//       createdAt: new Date(),
//     };
//     const userRef = await db.collection("users").add(newUser);
//     res.status(201).json({ id: userRef.id, ...newUser });
//   } catch (error) {
//     console.error("Error creating user:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// // Get user by ID
// export const getUserById = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const userRef = db.collection("users").doc(id);
//     const doc = await userRef.get();

//     if (!doc.exists) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     res.json({ id: doc.id, ...doc.data() });
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// // Update user
// export const updateUser = async (req, res) => {
//   const { id } = req.params;
//   const {
//     uid,
//     firstName,
//     lastName,
//     email,
//     username,
//     password,
//     oldProfileImageUrl,
//   } = req.body; // Dapatkan URL gambar lama
//   const file = req.file; // Ambil file dari req.file
//   let profileImageUrl; // Inisialisasi variabel profileImageUrl

//   try {
//     const updateData = {
//       firstName,
//       lastName,
//       email,
//       username,
//       password,
//     };

//     // Hapus nilai undefined
//     Object.keys(updateData).forEach(
//       (key) => updateData[key] === undefined && delete updateData[key]
//     );

//     // Update di Firestore
//     await db.collection("users").doc(id).update(updateData);
//     console.log(`User dengan ID ${id} berhasil diperbarui di Firestore.`);

//     // Update di Firebase Auth
//     await auth.updateUser(uid, {
//       email,
//       displayName: `${firstName} ${lastName}`,
//       password,
//     });
//     console.log(
//       `Pengguna dengan UID ${uid} berhasil diperbarui di Firebase Auth.`
//     );

//     // Jika ada file yang di-upload, simpan di Storage dan update URL di Firestore
//     if (file) {
//       const bucket = getStorage().bucket(); // Ambil bucket storage
//       const fileName = `${uuidv4()}_${file.originalname}`; // Buat nama file unik
//       const fileUpload = bucket.file(`images-user/${fileName}`); // Ganti dengan path yang sesuai

//       // Upload file
//       await fileUpload.save(file.buffer, {
//         contentType: file.mimetype,
//         resumable: false,
//         metadata: {
//           metadata: {
//             firebaseStorageDownloadTokens: uuidv4(), // Tambahkan token akses
//           },
//         },
//       });

//       // Dapatkan URL download dengan token
//       const [metadata] = await fileUpload.getMetadata(); // Ambil metadata file
//       const token = metadata.metadata.firebaseStorageDownloadTokens;
//       profileImageUrl = `https://firebasestorage.googleapis.com/v0/b/${
//         bucket.name
//       }/o/${encodeURIComponent(fileUpload.name)}?alt=media&token=${token}`;

//       // Update URL gambar di Firestore
//       await db.collection("users").doc(id).update({ profileImageUrl });
//       console.log(`URL gambar diperbarui di Firestore: ${profileImageUrl}`);

//       // Hapus gambar lama dari Storage jika ada
//       if (oldProfileImageUrl) {
//         const oldFileName = decodeURIComponent(
//           oldProfileImageUrl.split("/").pop().split("?")[0].split("%2F")[1]
//         ); // Ambil nama file dari URL
//         const oldFilePath = `images-user/${oldFileName}`; // Path ke gambar lama
//         await bucket.file(oldFilePath).delete(); // Hapus gambar lama
//         console.log(
//           `Gambar lama berhasil dihapus dari Storage: ${oldFilePath}`
//         );
//       }
//     }

//     res.status(200).json({
//       id,
//       ...updateData,
//       profileImageUrl: file ? profileImageUrl : oldProfileImageUrl, // Kembalikan URL gambar baru jika ada
//     });
//   } catch (error) {
//     console.error("Error updating user:", error);
//     res
//       .status(500)
//       .json({ error: "Internal Server Error", details: error.message });
//   }
// };

// // Delete user
// export const deleteUser = async (req, res) => {
//   const { id } = req.params;

//   try {
//     // Ambil data user dari Firestore untuk mendapatkan UID dan URL gambar
//     const userRef = db.collection("users").doc(id);
//     const userDoc = await userRef.get();

//     if (!userDoc.exists) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const userData = userDoc.data();
//     const uid = userData.uid; // Ambil UID dari data user
//     const profileImageUrl = userData.profileImageUrl; // Ambil URL gambar dari data user

//     // Cek keberadaan pengguna di Firebase Authentication
//     try {
//       const userRecord = await auth.getUser(uid);
//       // Hapus pengguna dari Firebase Authentication
//       await auth.deleteUser(uid);
//       console.log(`User with UID ${uid} deleted from Firebase Auth.`);
//     } catch (err) {
//       if (err.code === "auth/user-not-found") {
//         console.warn(`User with UID ${uid} not found in Firebase Auth.`);
//       } else {
//         console.error(`Error fetching user record: ${err.message}`);
//         return res
//           .status(500)
//           .json({ error: "Internal Server Error", details: err.message });
//       }
//     }

//     // Hapus gambar dari Firebase Storage jika ada
//     if (profileImageUrl) {
//       const bucket = getStorage().bucket(); // Ambil bucket storage
//       const fileName = decodeURIComponent(
//         profileImageUrl.split("/").pop().split("?")[0].split("%2F")[1]
//       ); // Ambil nama file dari URL
//       const filePath = `images-user/${fileName}`; // Path ke gambar di storage

//       try {
//         await bucket.file(filePath).delete();
//         console.log(`Gambar di Storage berhasil dihapus: ${filePath}`);
//       } catch (err) {
//         console.error(`Error deleting image from storage: ${err.message}`);
//       }
//     }

//     // Hapus user dari Firestore
//     await userRef.delete();
//     console.log(`User with ID ${id} has been deleted from Firestore.`);

//     res.status(204).send();
//   } catch (error) {
//     console.error("Error deleting user:", error); // Log detail kesalahan
//     res
//       .status(500)
//       .json({ error: "Internal Server Error", details: error.message });
//   }
// };


import { db, auth } from "../config/firebaseConfig.js";
import { getStorage } from "firebase-admin/storage";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Setup multer
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
  const { uid, firstName, lastName, email, username, password } = req.body;

  try {
    const newUser = {
      uid,
      firstName,
      lastName,
      email,
      username,
      password,
      profileImageUrl: req.file ? null : "default_profile_image_url",
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
      password,
    };

    // Hapus nilai undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Update di Firestore
    await db.collection("users").doc(id).update(updateData);

    // Update di Firebase Auth
    await auth.updateUser(uid, {
      email,
      displayName: `${firstName} ${lastName}`,
      password,
    });
    console.log(
      `Pengguna dengan UID ${uid} berhasil diperbarui di Firebase Auth.`
    );

    // Jika ada file yang di-upload, simpan di Storage dan update URL di Firestore
    if (file) {
      const bucket = getStorage().bucket(); // Ambil bucket storage
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
      profileImageUrl = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
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
        console.log(
          `Gambar lama berhasil dihapus dari Storage: ${oldFilePath}`
        );
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
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Ambil data user dari Firestore untuk mendapatkan UID dan URL gambar
    const userRef = db.collection("users").doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const uid = userData.uid;
    const profileImageUrl = userData.profileImageUrl;

    // Cek keberadaan pengguna di Firebase Authentication
    try {
      const userRecord = await auth.getUser(uid);
      // Hapus pengguna dari Firebase Authentication
      await auth.deleteUser(uid);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
      } else {
        return res
          .status(500)
          .json({ error: "Internal Server Error", details: err.message });
      }
    }

    // Hapus gambar dari Firebase Storage jika ada
    if (profileImageUrl) {
      const bucket = getStorage().bucket();
      const fileName = decodeURIComponent(
        profileImageUrl.split("/").pop().split("?")[0].split("%2F")[1]
      ); // Ambil nama file dari URL
      const filePath = `images-user/${fileName}`;

      try {
        await bucket.file(filePath).delete();
      } catch (err) {}
    }

    // Hapus user dari Firestore
    await userRef.delete();

    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};
