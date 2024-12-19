import { auth, db } from "../config/firebaseConfig.js";

const loginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(userRecord.uid);

    const adminSnapshot = await db
      .collection("admins")
      .where("email", "==", email)
      .get();

    let role = "user";

    if (!adminSnapshot.empty) {
      const adminData = adminSnapshot.docs[0].data();
      role = adminData.role;
    } else {
      const userSnapshot = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        role = userData.role || "user";
      }
    }

    res.status(200).json({
      message: "Login successful",
      token: customToken,
      role: role,
    });
  } catch (error) {
    res.status(400).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

export default loginController;
