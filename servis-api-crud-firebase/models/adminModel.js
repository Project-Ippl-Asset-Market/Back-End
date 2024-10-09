import express from "express";
import { checkRole } from "../middleware/authMiddleware.js";
import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAdminById,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/", checkRole(["superadmin"]), getAdmins);
router.post("/", checkRole(["superadmin"]), createAdmin);
router.put("/:id", checkRole(["superadmin"]), updateAdmin);
router.delete("/:id", checkRole(["superadmin"]), deleteAdmin);
router.get("/:id", checkRole(["superadmin"]), getAdminById);

export default router;
