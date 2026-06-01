const mongoose = require("mongoose");

const Expense = require("../models/Expense");
const { ensureGroupMember } = require("../services/groupService");
const asyncHandler = require("../utils/asyncHandler");
const { roundCurrency } = require("../utils/number");
const { sendSuccess } = require("../utils/response");

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const group = await ensureGroupMember(req.params.groupId, req.user._id);
  const requestedYear = Number(req.query.year) || new Date().getFullYear();
  const year = Number.isNaN(requestedYear) ? new Date().getFullYear() : requestedYear;
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);
  const groupObjectId = new mongoose.Types.ObjectId(req.params.groupId);

  const monthlyResults = await Expense.aggregate([
    {
      $match: {
        group: groupObjectId,
        date: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          $month: "$date"
        },
        totalSpend: {
          $sum: "$amount"
        },
        expenseCount: {
          $sum: 1
        }
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);

  const monthlyTotals = MONTH_LABELS.map((label, index) => {
    const result = monthlyResults.find((item) => item._id === index + 1);

    return {
      month: index + 1,
      label,
      totalSpend: roundCurrency(result?.totalSpend || 0),
      expenseCount: result?.expenseCount || 0
    };
  });

  const categoryResults = await Expense.aggregate([
    {
      $match: {
        group: groupObjectId,
        date: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $project: {
        amount: 1,
        categoryLabel: {
          $cond: [{ $eq: ["$category", "custom"] }, "$customCategory", "$category"]
        }
      }
    },
    {
      $group: {
        _id: "$categoryLabel",
        totalSpend: {
          $sum: "$amount"
        },
        expenseCount: {
          $sum: 1
        }
      }
    },
    {
      $sort: {
        totalSpend: -1
      }
    }
  ]);

  const contributionResults = await Expense.aggregate([
    {
      $match: {
        group: groupObjectId,
        date: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: "$paidBy",
        totalPaid: {
          $sum: "$amount"
        },
        expenseCount: {
          $sum: 1
        }
      }
    },
    {
      $sort: {
        totalPaid: -1
      }
    }
  ]);

  const highestSpendingMonth = monthlyTotals.reduce(
    (highestMonth, month) => {
      if (month.totalSpend > highestMonth.totalSpend) {
        return month;
      }

      return highestMonth;
    },
    {
      month: 0,
      label: "N/A",
      totalSpend: 0,
      expenseCount: 0
    }
  );

  sendSuccess(res, {
    message: "Monthly analytics fetched successfully.",
    data: {
      group: {
        _id: group._id,
        name: group.name,
        type: group.type
      },
      year,
      totalYearSpend: roundCurrency(
        monthlyTotals.reduce((sum, month) => sum + month.totalSpend, 0)
      ),
      monthlyTotals,
      categoryBreakdown: categoryResults.map((item) => ({
        category: item._id || "Uncategorized",
        totalSpend: roundCurrency(item.totalSpend),
        expenseCount: item.expenseCount
      })),
      memberContribution: contributionResults.map((item) => {
        const member = group.members.find(
          (groupMember) => String(groupMember.user._id) === String(item._id)
        );

        return {
          userId: item._id,
          name: member?.user?.name || "Unknown member",
          totalPaid: roundCurrency(item.totalPaid),
          expenseCount: item.expenseCount
        };
      }),
      highestSpendingMonth
    }
  });
});

module.exports = {
  getMonthlyAnalytics
};
