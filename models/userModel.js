import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from "./controllers/userController.js";

const router = express.Router();

router.get("/users", getAllUsers);
router.post("/users", upload.single("profileImage"), createUser);
router.get("/users/:id", getUserById);
router.put("/users/:id", upload.single("profileImage"), updateUser);
router.delete("/users/:id", deleteUser);

export default router;
