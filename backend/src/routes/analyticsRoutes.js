const express = require("express");

const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:groupId/analytics/monthly", protect, analyticsController.getMonthlyAnalytics);

module.exports = router;

