import express from "express";
import cors from "cors";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import dotenv from "dotenv";

dotenv.config();

// Firebase Admin Initialization
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const app = express();
app.use(cors());
app.use(express.json());

const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
const port = process.env.PORT || 3000;

const deleteFileFromStorage = async (filePath) => {
  const bucket = storage.bucket();
  await bucket.file(filePath).delete();
};

// CRUD routes for admins
app.get("/api/admins", async (req, res) => {
  try {
    const snapshot = await db.collection("admins").get();
    const admins = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/admins/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Fetching admin with ID:", id);

  try {
    const adminRef = db.collection("admins").doc(id);
    const doc = await adminRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/admins", async (req, res) => {
  const { email, firstName, lastName, profileImageUrl, role, uid, username } = req.body;
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
    console.error("Error creating admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/admins/:id", async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, profileImageUrl, role, uid, username } = req.body;

  console.log("Updating admin with ID:", id);

  try {
    const adminRef = db.collection("admins").doc(id);
    const doc = await adminRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Admin not found" });
    }

    await adminRef.update({
      email,
      firstName,
      lastName,
      profileImageUrl,
      role,
      uid,
      username,
    });

    res.status(200).json({
      id,
      email,
      firstName,
      lastName,
      profileImageUrl,
      role,
      uid,
      username,
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/admins/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Deleting admin with ID:", id);

  try {
    const adminRef = db.collection("admins").doc(id);
    const doc = await adminRef.get();

    if (!doc.exists) {
      console.log("Admin not found with ID:", id);
      return res.status(404).json({ error: "Admin not found" });
    }

    const adminData = doc.data();
    const { uid, profileImageUrl } = adminData;

    if (uid) {
      try {
        await auth.getUser(uid);
        await auth.deleteUser(uid);
        console.log(`User with UID ${uid} deleted from Firebase Auth.`);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          console.warn(`User with UID ${uid} not found. Skipping deletion.`);
        } else {
          console.error("Error deleting user from Firebase Auth:", error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      }
    } else {
      console.warn(`No UID provided for admin ID ${id}. Skipping deletion from Firebase Auth.`);
    }

    if (profileImageUrl) {
      const filePath = profileImageUrl.split("/o/")[1].split("?")[0];
      console.log(`Deleting file from Storage with path: ${filePath}`);

      if (!filePath.startsWith("images-admin")) {
        console.warn(`File path ${filePath} is not in the images-admin folder. Skipping deletion.`);
      } else {
        console.log("Deleting file from Storage:", filePath);
        try {
          await deleteFileFromStorage(filePath);
          console.log(`Image at ${filePath} has been deleted.`);
        } catch (error) {
          console.error("Error deleting image from Storage:", error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      }
    }

    await adminRef.delete();
    console.log("Admin deleted successfully from Firestore.");
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
