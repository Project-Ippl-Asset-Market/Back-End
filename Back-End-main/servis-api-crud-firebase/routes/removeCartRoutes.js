import express from "express";
import { removeCart } from "../controllers/removeCartController.js";

const router = express.Router();

router.delete("/removeCart/:docId", removeCart);

export default router;
