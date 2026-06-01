const Settlement = require("../models/Settlement");
const { logActivity } = require("../services/activityService");
const { ensureGroupMember, findMemberRecord, touchGroup } = require("../services/groupService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { roundCurrency } = require("../utils/number");
const { sendSuccess } = require("../utils/response");

const formatMiniUser = (user) => ({
  _id: user._id || user,
  name: user.name || "",
  email: user.email || "",
  profilePhoto: user.profilePhoto || ""
});

const formatSettlement = (settlement) => ({
  _id: settlement._id,
  group: settlement.group,
  paidBy: formatMiniUser(settlement.paidBy),
  receivedBy: formatMiniUser(settlement.receivedBy),
  amount: settlement.amount,
  note: settlement.note,
  date: settlement.date,
  createdBy: formatMiniUser(settlement.createdBy),
  createdAt: settlement.createdAt,
  updatedAt: settlement.updatedAt
});

const createSettlement = asyncHandler(async (req, res) => {
  const group = await ensureGroupMember(req.params.groupId, req.user._id);
  const paidBy = String(req.body.paidBy || "");
  const receivedBy = String(req.body.receivedBy || "");
  const amount = roundCurrency(req.body.amount);
  const note = String(req.body.note || "").trim();
  const date = req.body.date ? new Date(req.body.date) : null;

  if (!paidBy || !receivedBy) {
    throw new AppError("Both payer and receiver are required for a settlement.", 400);
  }

  if (paidBy === receivedBy) {
    throw new AppError("Payer and receiver must be different users.", 400);
  }

  if (!findMemberRecord(group, paidBy) || !findMemberRecord(group, receivedBy)) {
    throw new AppError("Settlement members must belong to the selected group.", 400);
  }

  if (amount <= 0) {
    throw new AppError("Settlement amount must be greater than zero.", 400);
  }

  if (!date || Number.isNaN(date.getTime())) {
    throw new AppError("A valid settlement date is required.", 400);
  }

  const settlement = await Settlement.create({
    group: group._id,
    paidBy,
    receivedBy,
    amount,
    note,
    date,
    createdBy: req.user._id
  });

  await touchGroup(group._id);
  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "settlement_added",
    message: `${req.user.name} recorded a settlement of Rs. ${amount}.`,
    metadata: {
      settlementId: settlement._id
    }
  });

  const populatedSettlement = await Settlement.findById(settlement._id)
    .populate("paidBy", "name email profilePhoto")
    .populate("receivedBy", "name email profilePhoto")
    .populate("createdBy", "name email profilePhoto");

  sendSuccess(res, {
    statusCode: 201,
    message: "Settlement recorded successfully.",
    data: {
      settlement: formatSettlement(populatedSettlement)
    }
  });
});

const getSettlements = asyncHandler(async (req, res) => {
  await ensureGroupMember(req.params.groupId, req.user._id, {
    populateMembers: false
  });

  const settlements = await Settlement.find({ group: req.params.groupId })
    .populate("paidBy", "name email profilePhoto")
    .populate("receivedBy", "name email profilePhoto")
    .populate("createdBy", "name email profilePhoto")
    .sort({ date: -1, createdAt: -1 });

  sendSuccess(res, {
    message: "Settlement history fetched successfully.",
    data: {
      settlements: settlements.map(formatSettlement)
    }
  });
});

module.exports = {
  createSettlement,
  getSettlements
};

