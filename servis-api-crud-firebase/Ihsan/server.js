// Import dependencies
import express from "express";
import midtransClient from "midtrans-client";
import cors from "cors";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };
import admin from "firebase-admin";

// Inisialisasi Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-asset-market.firebaseio.com", // Ganti dengan URL Firebase Database Anda
});

// Setup Firestore
const db = admin.firestore();

// Setup Express.js
const app = express();
const port = 5000;
app.use(cors()); // pastikan frontend bisa akses backend
app.use(express.json());

// Buat instance Snap dengan Server Key Midtrans
let snap = new midtransClient.Snap({
  isProduction: false, // Ubah ke true jika sudah di production
  serverKey: "SB-Mid-server-o3cccUq_DoskhewYcMvERVSH", // Server Key dari Midtrans
});

// Endpoint untuk membuat transaksi dan mendapatkan token Snap
app.post("/create-transaction", async (req, res) => {
  try {
    const { orderId, grossAmount, customerDetails } = req.body;

    // Parameter transaksi
    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: customerDetails,
    };

    // Buat transaksi
    const transaction = await snap.createTransaction(parameter);

    // Simpan detail transaksi ke Firebase
    await db.collection("transactions").doc(orderId).set({
      orderId: orderId,
      grossAmount: grossAmount,
      customerDetails: customerDetails,
      status: "pending",
      token: transaction.token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Kirim token Snap ke frontend
    res.json({ token: transaction.token });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: "Error creating transaction", error });
  }
});

// Endpoint untuk memperbarui status transaksi
app.post("/update-transaction", async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Update status transaksi di Firebase
    await db.collection("transactions").doc(orderId).update({
      status: status,
    });

    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Error updating transaction", error });
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
