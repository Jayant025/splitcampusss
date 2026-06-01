const express = require("express");

const expenseController = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");
const { createUploader } = require("../middleware/uploadMiddleware");

const router = express.Router();
const receiptUpload = createUploader("receipts");

router
  .route("/:groupId/expenses")
  .get(protect, expenseController.getExpenses)
  .post(protect, receiptUpload.single("receiptImage"), expenseController.createExpense);

router
  .route("/:groupId/expenses/:expenseId")
  .get(protect, expenseController.getExpenseById)
  .put(protect, receiptUpload.single("receiptImage"), expenseController.updateExpense)
  .delete(protect, expenseController.deleteExpense);

module.exports = router;

