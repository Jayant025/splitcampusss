const Expense = require("../models/Expense");
const Group = require("../models/Group");
const Settlement = require("../models/Settlement");
const AppError = require("../utils/appError");
const { roundCurrency } = require("../utils/number");

const simplifyDebts = (members) => {
  const creditors = members
    .filter((member) => member.netBalance > 0.01)
    .map((member) => ({
      ...member,
      amount: member.netBalance
    }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = members
    .filter((member) => member.netBalance < -0.01)
    .map((member) => ({
      ...member,
      amount: Math.abs(member.netBalance)
    }))
    .sort((a, b) => b.amount - a.amount);

  const suggestions = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = roundCurrency(Math.min(creditor.amount, debtor.amount));

    suggestions.push({
      fromUserId: debtor.userId,
      fromName: debtor.name,
      toUserId: creditor.userId,
      toName: creditor.name,
      amount
    });

    creditor.amount = roundCurrency(creditor.amount - amount);
    debtor.amount = roundCurrency(debtor.amount - amount);

    if (creditor.amount <= 0.01) {
      creditorIndex += 1;
    }

    if (debtor.amount <= 0.01) {
      debtorIndex += 1;
    }
  }

  return suggestions;
};

const calculateGroupBalances = async (groupId) => {
  const group = await Group.findById(groupId).populate("members.user", "name email profilePhoto");

  if (!group) {
    throw new AppError("Group not found.", 404);
  }

  const expenses = await Expense.find({ group: groupId }).select("amount paidBy splitMembers");
  const settlements = await Settlement.find({ group: groupId }).select("amount paidBy receivedBy");

  const membersMap = new Map();

  group.members.forEach((member) => {
    const memberId = String(member.user._id);

    membersMap.set(memberId, {
      userId: memberId,
      name: member.user.name,
      email: member.user.email,
      profilePhoto: member.user.profilePhoto,
      role: member.role,
      totalPaid: 0,
      totalOwed: 0,
      settlementPaid: 0,
      settlementReceived: 0,
      netBalance: 0
    });
  });

  expenses.forEach((expense) => {
    const paidById = String(expense.paidBy);

    if (membersMap.has(paidById)) {
      membersMap.get(paidById).totalPaid = roundCurrency(
        membersMap.get(paidById).totalPaid + expense.amount
      );
    }

    expense.splitMembers.forEach((splitItem) => {
      const splitUserId = String(splitItem.user);

      if (membersMap.has(splitUserId)) {
        membersMap.get(splitUserId).totalOwed = roundCurrency(
          membersMap.get(splitUserId).totalOwed + splitItem.amount
        );
      }
    });
  });

  settlements.forEach((settlement) => {
    const paidById = String(settlement.paidBy);
    const receivedById = String(settlement.receivedBy);

    if (membersMap.has(paidById)) {
      membersMap.get(paidById).settlementPaid = roundCurrency(
        membersMap.get(paidById).settlementPaid + settlement.amount
      );
    }

    if (membersMap.has(receivedById)) {
      membersMap.get(receivedById).settlementReceived = roundCurrency(
        membersMap.get(receivedById).settlementReceived + settlement.amount
      );
    }
  });

  const members = Array.from(membersMap.values()).map((member) => {
    const netBalance = roundCurrency(
      member.totalPaid - member.totalOwed + member.settlementPaid - member.settlementReceived
    );

    return {
      ...member,
      netBalance
    };
  });

  return {
    group: {
      _id: group._id,
      name: group.name,
      type: group.type,
      image: group.image
    },
    summary: {
      totalExpenses: roundCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
      totalSettlements: roundCurrency(
        settlements.reduce((sum, settlement) => sum + settlement.amount, 0)
      ),
      memberCount: members.length
    },
    members,
    simplifiedDebts: simplifyDebts(members)
  };
};

module.exports = {
  calculateGroupBalances
};

