// /routes/userRoutes.js
import express from "express";
import multer from "multer";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// CRUD routes for users
router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.put("/:id", upload.single("profileImage"), updateUser);
router.delete("/:id", deleteUser);

export default router;
