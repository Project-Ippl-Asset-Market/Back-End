import { db, midtrans } from "../config/firebaseConfig.js";

// Endpoint untuk membuat transaksi dan mendapatkan token Snap
export const createTransactionController = async (req, res) => {
  try {
    const { orderId, grossAmount, customerDetails } = req.body;

    // Pastikan grossAmount adalah bilangan bulat
    const formattedGrossAmount = Math.floor(grossAmount);

    // Parameter transaksi
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: formattedGrossAmount,
      },
      customer_details: customerDetails,
    };

    // Buat transaksi
    const transaction = await midtrans.createTransaction(parameter);

    // Simpan detail transaksi ke Firestore hanya jika berhasil
    await db.collection("transactions").doc(orderId).set({
      orderId: orderId,
      grossAmount: formattedGrossAmount,
      customerDetails: customerDetails,
      status: "pending",
      token: transaction.token,
      createdAt: new Date(),
    });

    // Kirim token Snap ke frontend
    res.status(201).json({ token: transaction.token });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res
      .status(500)
      .json({ message: "Error creating transaction", error: error.message });
  }
};

// Endpoint untuk memperbarui status transaksi
export const updateTransactionController = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await db.collection("transactions").doc(orderId).update({
      status: status,
    });

    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res
      .status(500)
      .json({ message: "Error updating transaction", error: error.message });
  }
};
