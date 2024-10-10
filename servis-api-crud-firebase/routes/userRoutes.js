// /routes/userRoutes.js
import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  deleteUser,
} from "../controllers/userController.js";

const router = express.Router();

// CRUD routes for users
router.get("/", getAllUsers);
router.post("/", createUser);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);

export default router;
