const express = require("express");

const settlementController = require("../controllers/settlementController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/:groupId/settlements")
  .get(protect, settlementController.getSettlements)
  .post(protect, settlementController.createSettlement);

module.exports = router;

