import { db, midtrans } from "../config/firebaseConfig.js";

export const createTransactionController = async (req, res) => {
  try {
    // console.log("Body permintaan:", req.body);

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
        name: asset.name ||
          asset.audioName ||
          asset.asset2DName ||
          asset.asset3DName ||
          asset.datasetName ||
          asset.imageName ||
          asset.videoName ||
          "name Found",
        image:
          asset.image ||
          asset.Image_umum ||
          asset.video ||
          asset.assetImageGame || asset.audioThumbnail || asset.datasetThumbnail ||
          asset.asset2DThumbnail ||
          asset.asset3DThumbnail || "url tidak ada",
        datasetFile: asset.datasetFile || asset.asset3DFile || asset.asset2DFile || asset.uploadUrlAudio || "tidak ada",
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
    // console.log("Respon Transaksi:", transaction);
    const saveTransactionData = {
      createdAt: new Date(),
      orderId,
      grossAmount: finalGrossAmount,
      customerDetails,
      assets: assets.map((asset) => ({
        assetId: asset.assetId,
        userId: asset.userId,
        price: Number(asset.price),
        name: asset.name ||
          asset.audioName ||
          asset.asset2DName ||
          asset.asset3DName ||
          asset.datasetName ||
          asset.imageName ||
          asset.videoName ||
          "name Found",
        image:
          asset.image ||
          asset.Image_umum ||
          asset.video ||
          asset.assetImageGame || asset.audioThumbnail || asset.datasetThumbnail ||
          asset.asset2DThumbnail ||
          asset.asset3DThumbnail || "url tidak ada",
        datasetFile: asset.datasetFile || asset.asset3DFile || asset.asset2DFile || asset.uploadUrlAudio || "tidak ada",
        description: asset.description,
        datasetFile: asset.datasetFile,
        category: asset.category,
        assetOwnerID: asset.assetOwnerID,
      })),
      uid,
      status: "pending",
      token: transaction.token,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    // console.log("Data transaksi yang akan disimpan:", saveTransactionData);
    await db.collection("transactions").doc(orderId).set(saveTransactionData);

    const docIdsToDelete = assets.map(asset => asset.docId);
    // console.log("DocIds to delete:", docIdsToDelete);

    const deleteBatch = db.batch();

    docIdsToDelete.forEach(docId => {
      if (docId) {
        const buyNowRef = db.collection("buyNow").doc(docId);
        deleteBatch.delete(buyNowRef);
      } else {
        // console.error("Invalid docId encountered:", docId);
      }
    });

    await deleteBatch.commit();
    // console.log(`Dokumen dengan docId ${docIdsToDelete.join(", ")} telah dihapus dari buyNow.`);

    res.status(201).json({ token: transaction.token, orderId });

  } catch (error) {
    console.error("Kesalahan saat membuat transaksi:", error);
    res.status(500).json({
      message: "Kesalahan saat membuat transaksi",
      error: error.message,
    });
  }
};


export const saveBuyAssetsController = async (req, res) => {
  try {
    const { orderId, assets } = req.body;

    if (!orderId || !assets || !Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ message: "Order ID dan aset diperlukan" });
    }

    const buyAssetsData = assets.map(asset => ({
      assetId: asset.assetId,
      userId: asset.userId,
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
      image: asset.image || asset.audioThumbnail || asset.datasetThumbnail
        || asset.asset2DThumbnail
        || asset.asset3DThumbnail || "File Tidak Tersedia",
      datasetFile: asset.datasetFile || asset.asset3DFile || asset.asset2DFile || asset.uploadUrlAudio || "tidak ada",
      description: asset.description,
      category: asset.category,
      assetOwnerID: asset.assetOwnerID,
      orderId,
      purchasedAt: new Date(),
      status: "success"
    }));

    const buyAssetsBatch = db.batch();
    buyAssetsData.forEach(buyAsset => {
      const buyAssetRef = db.collection("buyAssets").doc(buyAsset.assetId);
      buyAssetsBatch.set(buyAssetRef, buyAsset);
    });

    await buyAssetsBatch.commit();
    // console.log(`Data aset yang dibeli telah disimpan di buyAssets.`);

    const assetIdsToDelete = assets.map(asset => asset.assetId);
    const deleteBatch = db.batch();

    assetIdsToDelete.forEach(assetId => {
      const assetRef = db.collection("cartAssets").doc(assetId);
      deleteBatch.delete(assetRef);
    });

    assetIdsToDelete.forEach(assetId => {
      const buyNowRef = db.collection("buyNow").doc(assetId);
      deleteBatch.delete(buyNowRef);
    });

    await deleteBatch.commit();
    // console.log(`Dokumen dengan assetId ${assetIdsToDelete.join(", ")} telah dihapus dari cartAssets dan buyNow.`);

    res.status(201).json({ message: "Data aset berhasil disimpan di buyAssets dan dihapus dari cartAssets serta buyNow." });

  } catch (error) {
    // console.error("Kesalahan saat menyimpan data ke buyAssets:", error);
    res.status(500).json({
      message: "Kesalahan saat menyimpan data ke buyAssets",
      error: error.message,
    });
  }
};

// Controller untuk memperbarui status transaksi
export const updateTransactionController = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res
        .status(400)
        .json({ message: "Order ID dan status diperlukan" });
    }

    await db.collection("transactions").doc(orderId).update({ status });
    res.json({ message: "Transaksi berhasil diperbarui" });
  } catch (error) {
    console.error("Kesalahan saat memperbarui transaksi:", error);
    res
      .status(500)
      .json({ message: "Kesalahan saat memperbarui transaksi", error: error.message });
  }
};

// Middleware untuk memvalidasi data transaksi
export const validateTransactionData = (req, res, next) => {
  const { orderId, grossAmount, customerDetails } = req.body;
  if (
    !orderId ||
    grossAmount < 0.01 ||
    !customerDetails ||
    Object.keys(customerDetails).length === 0
  ) {
    return res.status(400).json({
      message:
        "Input tidak valid: orderId, grossAmount, dan customerDetails diperlukan dan grossAmount harus lebih besar dari atau sama dengan 0.01.",
    });
  }

  next();
};
