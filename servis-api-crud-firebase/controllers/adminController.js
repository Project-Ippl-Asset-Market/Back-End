import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const getAdmins = async (req, res) => {
  try {
    const snapshot = await db.collection("admins").get();
    const admins = [];
    snapshot.forEach((doc) => {
      admins.push({ id: doc.id, ...doc.data() });
    });
    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
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
    console.error("Error fetching admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, profileImageUrl, role, uid, username } =
    req.body;

  try {
    await db.collection("admins").doc(id).update({
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
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("admins").doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
