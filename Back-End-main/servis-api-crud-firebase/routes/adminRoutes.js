import express from "express";
import multer from "multer";
import {
  getAllAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from "../controllers/adminController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", getAllAdmins);
router.post("/", createAdmin);
router.get("/:id", getAdminById);
router.put("/:id", upload.single("profileImage"), updateAdmin);
router.delete("/:id", deleteAdmin);

export default router;
