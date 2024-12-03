// /server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import midtransClient from "midtrans-client";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { checkRole } from "./middleware/authMiddleware.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import { checkEmail } from "./controllers/authController.js";
import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkAssetRoutes from "./routes/checkAssetRoutes.js";
import loginController from "./controllers/loginController.js";
import fetch from "node-fetch";

const app = express();
const port = 3000;

// Menangani kesalahan (opsional, untuk penanganan kesalahan yang lebih baik)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.setHeader(
    "Permissions-Policy",
    "clipboard-read=(self), clipboard-write=(self)"
  );
  res.status(500).send("Something went wrong!");
  next();
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// Gunakan rute
app.use("/api/users", userRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/checkAsset", checkAssetRoutes);
app.post("/api/logins", loginController);

// proxy preview dataset
app.get("/api/proxy-file", async (req, res) => {
  const fileUrl = req.query.url; // URL file Firebase Storage

  try {
    if (!fileUrl) {
      return res.status(400).send("File URL is required.");
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch file: ${response.statusText}`);
    }

    res.set("Content-Type", response.headers.get("content-type"));
    response.body.pipe(res);
    
  } catch (error) {
    console.error("Error proxying file:", error);
    res.status(500).send("Internal Server Error.");
  }
});


// Menangani kesalahan (opsional, untuk penanganan kesalahan yang lebih baik)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
