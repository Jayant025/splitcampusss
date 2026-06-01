const express = require("express");

const userController = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { createUploader } = require("../middleware/uploadMiddleware");

const router = express.Router();
const profileUpload = createUploader("profiles");

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, profileUpload.single("profilePhoto"), userController.updateProfile);
router.put("/password", protect, userController.changePassword);

module.exports = router;

