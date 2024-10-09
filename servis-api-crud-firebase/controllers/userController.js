import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const getUsers = async (req, res) => {
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

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("users").doc(id).delete();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
