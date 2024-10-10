import { db, auth, storage } from "../config/firebaseConfig.js";
// import { deleteFileFromStorage } from "../utils/storage.js";

export const getAdmins = async (req, res) => {
  try {
    const snapshot = await db.collection("admins").get();
    const admins = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAdminById = async (req, res) => {
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
    console.error("Error creating admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, profileImageUrl, role, uid, username } =
    req.body;

  console.log("Updating admin with ID:", id);

  // Cek apakah ID dokumen ada
  if (!id) {
    return res.status(400).json({ error: "Admin ID is required" });
  }

  // Membangun objek update berdasarkan field yang tidak undefined
  const updateData = {};
  if (email !== undefined) updateData.email = email;
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (profileImageUrl !== undefined)
    updateData.profileImageUrl = profileImageUrl;
  if (role !== undefined) updateData.role = role;
  if (uid !== undefined) updateData.uid = uid;
  if (username !== undefined) updateData.username = username;

  try {
    const adminRef = db.collection("admins").doc(id);
    const doc = await adminRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Lakukan pembaruan hanya jika ada data yang ingin diupdate
    if (Object.keys(updateData).length > 0) {
      await adminRef.update(updateData);
    }

    res.status(200).json({ id, ...updateData });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteAdmin = async (req, res) => {
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

    // Hapus user dari Firebase Auth jika UID ada
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
      console.warn(
        `No UID provided for admin ID ${id}. Skipping deletion from Firebase Auth.`
      );
    }

    // Hapus gambar dari Firebase Storage jika URL ada
    if (profileImageUrl) {
      const filePath = profileImageUrl.split("/o/")[1]?.split("?")[0]; // Mendapatkan path file tanpa parameter query
      console.log(`Deleting file from Storage with path: ${filePath}`);

      if (!filePath || !filePath.startsWith("images-admin/")) {
        console.warn(`Invalid file path: ${filePath}. Skipping deletion.`);
      } else {
        try {
          await deleteFileFromStorage(filePath);
          console.log(`Image at ${filePath} has been deleted.`);
        } catch (error) {
          console.error("Error deleting image from Storage:", error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
      }
    }

    // Hapus dokumen admin dari Firestore
    await adminRef.delete();
    console.log("Admin deleted successfully from Firestore.");
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
