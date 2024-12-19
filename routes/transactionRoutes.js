import { db, midtrans } from "../config/firebaseConfig.js";

// Fungsi untuk memindahkan aset dari cartAssets ke buyAssets
const moveAssetsToBuyAssets = async (assets) => {
  const buyAssetsPromises = assets.map(async (asset) => {
    const newAsset = {
      assetId: asset.assetId,
      price: Number(asset.price),
      name: asset.name,
      image: asset.image || "Tidak terditek",
      datasetFile: asset.datasetFile || "tidak ada",
      userId: asset.userId,
      description: asset.description,
      category: asset.category,
      assetOwnerID: asset.assetOwnerID,
      size: asset.size || asset.resolution || "size & Resolution tidak ada",
      createdAt : new Date(),
    };

    // Simpan aset ke koleksi buyAssets
    await db.collection("buyAssets").doc(asset.assetId).set(newAsset);
  });

  await Promise.all(buyAssetsPromises);
};

export const createTransactionController = async (req, res) => {
  try {
    console.log("Body permintaan:", req.body);

    const { orderId, grossAmount, customerDetails, assets, uid } = req.body;

    // Validasi detail pelanggan
    if (
      !customerDetails ||
      !customerDetails.fullName ||
      !customerDetails.email ||
      !customerDetails.phoneNumber
    ) {
      console.error("Detail pelanggan tidak lengkap dalam body permintaan");
      return res.status(400).json({
        message:
          "customerDetails, fullName, email, atau phoneNumber tidak ditemukan",
      });
    }

    // Validasi aset
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      console.error("Aset tidak disediakan atau tidak valid");
      return res
        .status(400)
        .json({ message: "aset tidak ditemukan atau tidak valid" });
    }

    const formattedGrossAmount = Number(grossAmount);
    const itemDetails = assets.map((asset) => {
      if (!asset.assetOwnerID) {
        console.error(
          `Asset dengan ID ${asset.assetId} tidak memiliki assetOwnerID.`
        );
        return res
          .status(400)
          .json({ message: "assetOwnerID tidak ditemukan di beberapa asset." });
      }

      return {
        id: asset.assetId,
        uid: uid,
        price: Number(asset.price),
        name: {
          nameAsset:
            asset.name ||
            asset.audioName ||
            asset.asset2DName ||
            asset.asset3DName ||
            asset.datasetName ||
            asset.imageName ||
            asset.videoName ||
            "name Found",
        },
        image:
          asset.image ||
          asset.video ||
          asset.assetImageGame ||
          "Tidak terditek",
        quantity: 1,
        subtotal: Number(asset.price),
        description: asset.description,
        category: asset.category,
        userId: asset.userId,
        assetOwnerID: asset.assetOwnerID,
      };
    });

    const totalCalculated = itemDetails.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    if (totalCalculated !== formattedGrossAmount) {
      console.error(
        `Ketidaksesuaian gross amount: diharapkan ${totalCalculated}, tetapi mendapatkan ${formattedGrossAmount}`
      );
      return res.status(400).json({
        message: `Ketidaksesuaian gross amount: diharapkan ${totalCalculated}, tetapi mendapatkan ${formattedGrossAmount}`,
      });
    }

    const transactionFee = 2500;
    const finalGrossAmount = formattedGrossAmount + transactionFee;
    const paymentParameters = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalGrossAmount,
      },
      customer_details: {
        full_name: customerDetails.fullName,
        email: customerDetails.email,
        phone: customerDetails.phoneNumber,
      },
      item_details: [
        ...itemDetails,
        {
          id: "transaction_fee",
          price: transactionFee,
          name: "Biaya Transaksi",
          quantity: 1,
          subtotal: transactionFee,
        },
      ],
    };

    const transaction = await midtrans.createTransaction(paymentParameters);
    console.log("Respon Transaksi:", transaction);
    const saveTransactionData = {
      createdAt: new Date(),
      orderId,
      grossAmount: finalGrossAmount,
      customerDetails,
      assets: assets.map((asset) => ({
        assetId: asset.assetId,
        userId: asset.userId,
        price: Number(asset.price),
        image:
          asset.image ||
          asset.Image_umum ||
          asset.uploadUrlImage ||
          asset.datasetImage ||
          asset.assetAudiosImage ||
          asset.uploadUrlVideo ||
          asset.asset2DImage ||
          asset.asset3DImage ||
          asset.datasetThumbnail ||
          asset.asset2DThumbnail ||
          asset.asset3DThumbnail ||
          "Tidak terditek",
        description: asset.description,
        datasetFile: asset.datasetFile,
        category: asset.category,
        assetOwnerID: asset.assetOwnerID,
      })),
      uid,
      status: "Pending", // Ubah status dari "Panding" ke "Pending"
      token: transaction.token,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    console.log("Data transaksi yang akan disimpan:", saveTransactionData);

    // Simpan ke Firestore
    await db.collection("transactions").doc(orderId).set(saveTransactionData);

    // **NEW**: Pindahkan aset ke buyAssets setelah transaksi berhasil
    await moveAssetsToBuyAssets(assets);

    // Kembalikan token ke klien
    res.status(201).json({ token: transaction.token });
  } catch (error) {
    console.error("Kesalahan saat membuat transaksi:", error);
    res.status(500).json({
      message: "Kesalahan saat membuat transaksi",
      error: error.message,
    });
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
    grossAmount < 0.01 ||
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
router.post(
  "/create-transaction",
  validateTransactionData,
  createTransactionController
);

router.put("/update-transaction", updateTransactionController);

export default router;
