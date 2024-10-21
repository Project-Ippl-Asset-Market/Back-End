// Import your dependencies
import { db, midtrans } from "../config/firebaseConfig.js";

// Controller for creating transactions and getting the Snap token
export const createTransactionController = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log for debugging

    const { orderId, grossAmount, customerDetails, assets, uid } = req.body;

    // Validate customerDetails
    if (
      !customerDetails ||
      !customerDetails.fullName ||
      !customerDetails.email ||
      !customerDetails.phoneNumber
    ) {
      console.error("Customer details not complete in request body");
      return res.status(400).json({
        message: "customerDetails, fullName, email, or phoneNumber not found",
      });
    }

    // Validate assets
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      console.error("Assets not provided or invalid");
      return res.status(400).json({ message: "assets not found or invalid" });
    }

    // Ensure grossAmount is a number
    const formattedGrossAmount = Number(grossAmount);

    // Create item details array, ensuring prices are numbers
    const itemDetails = assets.map((asset) => ({
      id: asset.assetId,
      price: Number(asset.price), // Convert price to number
      name: asset.name || "Unknown Item", // Use a default name if not provided
      quantity: 1, // Assuming quantity is always 1 for now; adjust as necessary
      subtotal: Number(asset.price), // Calculate subtotal ensuring it's a number
    }));

    // Sum up the subtotals to verify with gross amount
    const totalCalculated = itemDetails.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    // Check for gross amount mismatch
    if (totalCalculated !== formattedGrossAmount) {
      console.error(
        `Gross amount mismatch: expected ${totalCalculated}, but got ${formattedGrossAmount}`
      );
      return res.status(400).json({
        message: `Gross amount mismatch: expected ${totalCalculated}, but got ${formattedGrossAmount}`,
      });
    }

    // Parameters for Midtrans transaction
    const paymentParameters = {
      transaction_details: {
        order_id: orderId,
        gross_amount: formattedGrossAmount,
      },
      customer_details: {
        full_name: customerDetails.fullName,
        email: customerDetails.email,
        phone: customerDetails.phoneNumber,
      },
      item_details: itemDetails,
    };

    // Create the transaction in Midtrans
    const transaction = await midtrans.createTransaction(paymentParameters);
    console.log("Transaction Response:", transaction);

    // Save transaction details to Firestore
    await db
      .collection("transactions")
      .doc(orderId)
      .set({
        createdAt: new Date(),
        orderId,
        grossAmount: formattedGrossAmount,
        customerDetails,
        assets,
        uid, // User ID
        status: "pending", // Initial transaction status
        token: transaction.token,
        transactionId: transaction.transaction_id || null,
        channel: transaction.channel || null,
        source: transaction.source || null,
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
      });

    // Return the token to the client
    res.status(201).json({ token: transaction.token });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res
      .status(500)
      .json({ message: "Error creating transaction", error: error.message });
  }
};

// Controller for updating transaction status
export const updateTransactionController = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Validate input data
    if (!orderId || !status) {
      return res
        .status(400)
        .json({ message: "Order ID and status are required" });
    }

    // Update the transaction status in Firestore
    await db.collection("transactions").doc(orderId).update({ status });
    res.json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res
      .status(500)
      .json({ message: "Error updating transaction", error: error.message });
  }
};

// Middleware for validating transaction data
export const validateTransactionData = (req, res, next) => {
  const { orderId, grossAmount, customerDetails } = req.body;

  // Validate input data
  if (
    !orderId ||
    grossAmount < 0.01 || // Ensure gross amount is positive
    !customerDetails ||
    Object.keys(customerDetails).length === 0
  ) {
    return res.status(400).json({
      message:
        "Invalid input: orderId, grossAmount, and customerDetails are required and grossAmount must be greater than or equal to 0.01.",
    });
  }

  next();
};

// Express Router Setup
import express from "express";

const router = express.Router();

// Route for creating transactions with validation
router.post(
  "/create-transaction",
  validateTransactionData,
  createTransactionController
);

// Route for updating transaction status
router.put("/update-transaction", updateTransactionController);

export default router;
