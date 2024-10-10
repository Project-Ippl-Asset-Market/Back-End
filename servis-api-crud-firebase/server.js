// /server.js
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { checkRole } from "./middleware/authMiddleware.js";  

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// Gunakan rute
app.use("/api/users", userRoutes);
app.use("/api/admins", adminRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
