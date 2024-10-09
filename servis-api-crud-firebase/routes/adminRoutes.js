import express from "express";
import {
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "../controllers/adminController.js";
import { checkRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Superadmin can CRUD admins
router.get("/", checkRole(["superadmin"]), getAdmins);
router.post("/", checkRole(["superadmin"]), createAdmin);
router.get("/:id", checkRole(["superadmin"]), getAdminById);
router.put("/:id", checkRole(["superadmin"]), updateAdmin);
router.delete("/:id", checkRole(["superadmin"]), deleteAdmin);

export default router;
