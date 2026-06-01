const express = require("express");

const personalExpenseController = require("../controllers/personalExpenseController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/summary", personalExpenseController.getPersonalExpenseSummary);
router.get("/analytics", personalExpenseController.getPersonalExpenseAnalytics);
router
  .route("/")
  .get(personalExpenseController.getPersonalExpenses)
  .post(personalExpenseController.createPersonalExpense);

router
  .route("/:expenseId")
  .put(personalExpenseController.updatePersonalExpense)
  .delete(personalExpenseController.deletePersonalExpense);

module.exports = router;

