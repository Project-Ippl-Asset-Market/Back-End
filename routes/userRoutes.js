import express from "express";
import multer from "multer";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
} from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.put("/:id", upload.single("profileImage"), updateUser);
router.delete("/:id", deleteUser);
router.post("/login", loginUser);

export default router;