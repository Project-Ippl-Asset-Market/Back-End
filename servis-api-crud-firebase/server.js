// Import dependencies
import express from "express";
import midtransClient from "midtrans-client";
import cors from "cors";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };
import admin from "firebase-admin";

// Inisialisasi Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://kuroko-6ab63.firebaseio.com", // Ganti dengan URL Firebase Database Anda
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
    const { orderId, customerDetails, items } = req.body; // Hilangkan `grossAmount` dari request body

    // Hitung ulang grossAmount dari item details
    const grossAmount = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Parameter transaksi
    let parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: items.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })), // Gunakan `items` untuk mengisi detail produk
      customer_details: customerDetails,
      callbacks: {
        finish: "http://localhost:5173/thanks",
      },
    };

    // Buat transaksi
    const transaction = await snap.createTransaction(parameter);

    // Simpan detail transaksi ke Firebase
    await db.collection("transactions").doc(orderId).set({
      orderId: orderId,
      grossAmount: grossAmount,
      customerDetails: customerDetails,
      items: items, // Simpan detail item juga
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

// Endpoint untuk mendapatkan detail transaksi
app.get("/transaction-details/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Ambil data transaksi dari Firebase menggunakan orderId
    const transactionDoc = await db
      .collection("transactions")
      .doc(orderId)
      .get();

    if (!transactionDoc.exists) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    const transactionData = transactionDoc.data();

    // Dapatkan status transaksi terbaru dari Midtrans
    const transactionStatus = await snap.transaction.status(orderId);

    // Gabungkan data Firebase dengan status terbaru dari Midtrans
    const fullDetails = {
      ...transactionData,
      status: transactionStatus.transaction_status,
      payment_type: transactionStatus.payment_type,
      transaction_time: transactionStatus.transaction_time,
      gross_amount: transactionStatus.gross_amount,
    };

    // Kirim data lengkap transaksi ke frontend
    res.json(fullDetails);
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res
      .status(500)
      .json({ message: "Error fetching transaction details", error });
  }
});
app.get("/transaction-details/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Ambil data transaksi dari Firebase menggunakan orderId
    const transactionDoc = await db
      .collection("transactions")
      .doc(orderId)
      .get();

    if (!transactionDoc.exists) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    const transactionData = transactionDoc.data();

    // Kirim data transaksi ke frontend
    res.json(transactionData);
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res
      .status(500)
      .json({ message: "Error fetching transaction details", error });
  }
});
app.get("/transaction-details/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Ambil data transaksi dari Firebase menggunakan orderId
    const transactionDoc = await db
      .collection("transactions")
      .doc(orderId)
      .get();

    if (!transactionDoc.exists) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    const transactionData = transactionDoc.data();

    // Kirim data transaksi ke frontend
    res.json(transactionData);
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res
      .status(500)
      .json({ message: "Error fetching transaction details", error });
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
