import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  deleteUser,
} from "../controllers/userController.js";
import { checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin role can CRUD users
router.get("/", checkRole(["admin", "superadmin"]), getUsers);
router.post("/", checkRole(["admin", "superadmin"]), createUser);
router.get("/:id", checkRole(["admin", "superadmin"]), getUserById);
router.delete("/:id", checkRole(["admin", "superadmin"]), deleteUser);

export default router;
