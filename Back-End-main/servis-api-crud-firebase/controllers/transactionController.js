import { db, midtrans } from "../config/firebaseConfig.js";

// Endpoint for creating transactions and getting the Snap token
export const createTransactionController = async (req, res) => {
  try {
    const { orderId, grossAmount, customerDetails, assets, uid } = req.body;

    // Validate customerDetails
    if (
      !customerDetails ||
      !customerDetails.full_name ||
      !customerDetails.email ||
      !customerDetails.phone
    ) {
      console.error("Customer details not complete in request body");
      return res.status(400).json({
        message: "customerDetails, full_name, email, or phone not found",
      });
    }

    // Validate assets
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      console.error("Assets not provided or invalid");
      return res.status(400).json({
        message: "assets not found or invalid",
      });
    }

    // Ensure grossAmount is correct
    const formattedGrossAmount = Math.floor(grossAmount);

    // Create item details array
    const itemDetails = assets.map((asset) => ({
      id: asset.id,
      price: asset.price,
      quantity: asset.quantity,
      name: asset.name,
      subtotal: asset.price * asset.quantity,
    }));

    // Sum up the subtotals to verify with gross amount
    const totalCalculated = itemDetails.reduce(
      (total, item) => total + item.subtotal,
      0
    );
    if (totalCalculated !== formattedGrossAmount) {
      console.error(
        `Gross amount mismatch: expected ${totalCalculated}, but got ${formattedGrossAmount}`
      );
      return res.status(400).json({
        message: `Gross amount mismatch: expected ${totalCalculated}, but got ${formattedGrossAmount}`,
      });
    }

    // Parameters for Midtrans transaction
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: formattedGrossAmount,
      },
      customer_details: {
        full_name: customerDetails.full_name,
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      item_details: itemDetails,
    };

    const transaction = await midtrans.createTransaction(parameter);
    console.log("Transaction Response:", transaction);

    // Save assets to buyAssets collection
    const buyAssetPromises = assets.map(async (asset) => {
      const buyAssetDocRef = db.collection("buyAssets").doc(); // Create a new document
      await buyAssetDocRef.set({
        assetId: asset.assetId,
        price: asset.price,
        name: asset.name,
        image: asset.image || "url tidak ada",
        datasetFile: asset.datasetFile || "tidak ada",
        userId: uid,
        description: asset.description || "No Description",
        category: asset.category || "Uncategorized",
        assetOwnerID: asset.assetOwnerID || "Asset Owner ID Not Available",
        size: asset.size || asset.resolution || "size & Resolution tidak ada",
        createdAt: new Date(),
        orderId: orderId, // Link to the order
      });
    });

    await Promise.all(buyAssetPromises);

    // Save transaction details to transactions collection
    await db
      .collection("transactions")
      .doc(orderId)
      .set({
        createdAt: new Date(),
        orderId: orderId,
        grossAmount: formattedGrossAmount,
        customerDetails: customerDetails,
        assets: assets,
        uid: uid,
        status: "success",
        token: transaction.token,
        transactionId: transaction.transaction_id || null,
        channel: transaction.channel || null,
        source: transaction.source || null,
        expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

    res.status(201).json({ token: transaction.token });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res
      .status(500)
      .json({ message: "Error creating transaction", error: error.message });
  }
};

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
