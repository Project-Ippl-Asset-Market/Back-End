// middlewares/validateTransaction.js
export const validateTransactionData = (req, res, next) => {
  const { orderId, grossAmount, customerDetails } = req.body;

  // Validasi data
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
