const express = require("express");

const groupController = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");
const { createUploader } = require("../middleware/uploadMiddleware");

const router = express.Router();
const groupUpload = createUploader("groups");

router.route("/").get(protect, groupController.getGroups).post(
  protect,
  groupUpload.single("image"),
  groupController.createGroup
);

router.post("/join", protect, groupController.joinGroupByInviteCode);
router.get("/:groupId", protect, groupController.getGroupById);
router.put("/:groupId", protect, groupUpload.single("image"), groupController.updateGroup);
router.get("/:groupId/dashboard", protect, groupController.getGroupDashboard);
router.get("/:groupId/balances", protect, groupController.getGroupBalances);
router.post("/:groupId/members", protect, groupController.addMemberByEmail);
router.delete("/:groupId/members/:userId", protect, groupController.removeMember);
router.post("/:groupId/leave", protect, groupController.leaveGroup);

module.exports = router;
