// /server.js
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { checkRole } from "./middleware/authMiddleware.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import { checkEmail } from "./controllers/authController.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// Gunakan rute
app.use("/api/users", userRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", authRoutes);

// Menangani kesalahan (opsional, untuk penanganan kesalahan yang lebih baik)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
