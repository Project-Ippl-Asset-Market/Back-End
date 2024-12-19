import { db, auth } from "../config/firebaseConfig.js";
import { getStorage } from "firebase-admin/storage";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";
import admin from "firebase-admin";

const storage = new Storage();
const bucket = storage.bucket("my-asset-market.appspot.com");
const upload = multer({ storage: multer.memoryStorage() });

export const getAllAdmins = async (req, res) => {
  try {
    const snapshot = await db.collection("admins").get();
    const admins = [];
    snapshot.forEach((doc) => {
      admins.push({ id: doc.id, ...doc.data() });
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createAdmin = async (req, res) => {
  const { email, firstName, lastName, profileImageUrl, role, uid, username } =
    req.body;
  if (!role) return res.status(400).json({ error: "Role is required" });

  try {
    const newAdmin = {
      email,
      firstName,
      lastName,
      profileImageUrl,
      role,
      uid,
      username,
      createdAt: new Date(),
    };
    const adminRef = await db.collection("admins").add(newAdmin);
    res.status(201).json({ id: adminRef.id, ...newAdmin });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAdminById = async (req, res) => {
  const { id } = req.params;

  try {
    const adminRef = db.collection("admins").doc(id);
    const doc = await adminRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const {
    uid,
    email,
    firstName,
    lastName,
    role,
    username,
    oldProfileImageUrl,
    password,
  } = req.body;
  const file = req.file;
  let profileImageUrl;

  try {
    const updateData = {
      email,
      firstName,
      lastName,
      role,
      username,
    };

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    await db.collection("admins").doc(id).update(updateData);
    // console.log(`Admin dengan ID ${id} berhasil diperbarui di Firestore.`);

    // Update di Firebase Auth
    const authUpdateData = {
      email,
      displayName: `${firstName} ${lastName}`,
    };
    if (password) {
      authUpdateData.password = password;
    }

    await auth.updateUser(uid, authUpdateData);
    console.log(
      `Pengguna dengan UID ${uid} berhasil diperbarui di Firebase Auth.`
    );

    if (file) {
      const bucket = getStorage().bucket();
      const fileName = `${uuidv4()}_${file.originalname}`;
      const fileUpload = bucket.file(`images-admin/${fileName}`);

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

      const [metadata] = await fileUpload.getMetadata();
      const token = metadata.metadata.firebaseStorageDownloadTokens;
      profileImageUrl = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURIComponent(fileUpload.name)}?alt=media&token=${token}`;

      await db.collection("admins").doc(id).update({ profileImageUrl });
      console.log(`URL gambar diperbarui di Firestore: ${profileImageUrl}`);

      // Hapus gambar lama dari Storage jika ada
      if (oldProfileImageUrl) {
        const oldFileName = decodeURIComponent(
          oldProfileImageUrl.split("/").pop().split("?")[0].split("%2F")[1]
        );
        const oldFilePath = `images-admin/${oldFileName}`;
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
    console.error("Error updating admin:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const adminRef = db.collection("admins").doc(id);
    const adminDoc = await adminRef.get();

    if (!adminDoc.exists) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const adminData = adminDoc.data();
    const uid = adminData.uid;

    await auth.deleteUser(uid);

    await adminRef.delete();

    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};
