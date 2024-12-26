import express from "express";
import { removeCart } from "../controllers/removeCartController.js";

const router = express.Router();

router.post("/removeCart/:docId", removeCart);

export default router;
