const Expense = require("../models/Expense");
const Group = require("../models/Group");
const Settlement = require("../models/Settlement");
const { calculateGroupBalances } = require("../services/balanceService");
const asyncHandler = require("../utils/asyncHandler");
const { roundCurrency } = require("../utils/number");
const { sendSuccess } = require("../utils/response");

const formatMiniUser = (user) => ({
  _id: user._id || user,
  name: user.name || "",
  email: user.email || "",
  profilePhoto: user.profilePhoto || ""
});

const getPersonalDashboard = asyncHandler(async (req, res) => {
  const groups = await Group.find({ "members.user": req.user._id })
    .select("name description type image inviteCode updatedAt members")
    .sort({ updatedAt: -1 });

  const groupIds = groups.map((group) => group._id);

  const totalPaidResult = groupIds.length
    ? await Expense.aggregate([
        {
          $match: {
            group: { $in: groupIds },
            paidBy: req.user._id
          }
        },
        {
          $group: {
            _id: null,
            totalPaid: {
              $sum: "$amount"
            }
          }
        }
      ])
    : [];

  let totalUserOwes = 0;
  let totalOthersOweUser = 0;

  for (const groupId of groupIds) {
    const balanceData = await calculateGroupBalances(groupId);
    const currentUserBalance = balanceData.members.find(
      (member) => member.userId === String(req.user._id)
    );

    if (!currentUserBalance) {
      continue;
    }

    if (currentUserBalance.netBalance < 0) {
      totalUserOwes = roundCurrency(totalUserOwes + Math.abs(currentUserBalance.netBalance));
    } else {
      totalOthersOweUser = roundCurrency(totalOthersOweUser + currentUserBalance.netBalance);
    }
  }

  const recentExpenses = groupIds.length
    ? await Expense.find({
        group: { $in: groupIds },
        $or: [{ paidBy: req.user._id }, { "splitMembers.user": req.user._id }]
      })
        .populate("group", "name type image")
        .populate("paidBy", "name email profilePhoto")
        .sort({ date: -1, createdAt: -1 })
        .limit(6)
    : [];

  const recentSettlements = groupIds.length
    ? await Settlement.find({
        group: { $in: groupIds },
        $or: [{ paidBy: req.user._id }, { receivedBy: req.user._id }]
      })
        .populate("group", "name type image")
        .populate("paidBy", "name email profilePhoto")
        .populate("receivedBy", "name email profilePhoto")
        .sort({ date: -1, createdAt: -1 })
        .limit(6)
    : [];

  sendSuccess(res, {
    message: "Personal dashboard fetched successfully.",
    data: {
      stats: {
        totalPaid: roundCurrency(totalPaidResult[0]?.totalPaid || 0),
        totalUserOwes,
        totalOthersOweUser,
        activeGroups: groups.length
      },
      groups: groups.map((group) => ({
        _id: group._id,
        name: group.name,
        description: group.description,
        type: group.type,
        image: group.image,
        inviteCode: group.inviteCode,
        memberCount: group.members.length,
        updatedAt: group.updatedAt
      })),
      recentExpenses: recentExpenses.map((expense) => ({
        _id: expense._id,
        title: expense.title,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        customCategory: expense.customCategory,
        categoryLabel: expense.category === "custom" ? expense.customCategory : expense.category,
        paidBy: formatMiniUser(expense.paidBy),
        group: expense.group
      })),
      recentSettlements: recentSettlements.map((settlement) => ({
        _id: settlement._id,
        amount: settlement.amount,
        date: settlement.date,
        note: settlement.note,
        paidBy: formatMiniUser(settlement.paidBy),
        receivedBy: formatMiniUser(settlement.receivedBy),
        group: settlement.group
      }))
    }
  });
});

module.exports = {
  getPersonalDashboard
};

