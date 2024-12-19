// middlewares/validateTransaction.js
export const validateTransactionData = (req, res, next) => {
  const { orderId, grossAmount, customerDetails, assets } = req.body;
  const adminFee = 2500;

  // Validasi data
  if (
    !orderId ||
    !grossAmount ||
    grossAmount < adminFee + 0.01 ||
    !customerDetails ||
    Object.keys(customerDetails).length === 0 ||
    !assets ||
    !Array.isArray(assets) ||
    assets.length === 0
  ) {
    return res.status(400).json({
      message:
        "Invalid input: orderId, grossAmount, customerDetails, and assets are required. Gross amount must be greater than admin fee.",
    });
  }

  next();
};
