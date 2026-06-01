const PersonalExpense = require("../models/PersonalExpense");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { PERSONAL_EXPENSE_CATEGORIES } = require("../utils/constants");
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

const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
};

const parseMonthRange = (monthValue) => {
  const normalizedMonth = String(monthValue || "").trim();

  if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) {
    throw new AppError("Month filter must be in YYYY-MM format.", 400);
  }

  const [year, month] = normalizedMonth.split("-").map(Number);

  if (month < 1 || month > 12) {
    throw new AppError("Month filter is invalid.", 400);
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  return {
    year,
    month,
    monthValue: normalizedMonth,
    startDate,
    endDate
  };
};

const getYearRange = (yearValue) => {
  const year = Number(yearValue) || new Date().getUTCFullYear();

  if (Number.isNaN(year) || year < 2000 || year > 2100) {
    throw new AppError("Year filter is invalid.", 400);
  }

  return {
    year,
    startDate: new Date(Date.UTC(year, 0, 1)),
    endDate: new Date(Date.UTC(year + 1, 0, 1))
  };
};

const formatPersonalExpense = (expense) => ({
  _id: expense._id,
  title: expense.title,
  amount: expense.amount,
  category: expense.category,
  date: expense.date,
  note: expense.note,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt
});

const validatePersonalExpenseInput = (payload) => {
  const title = String(payload.title || "").trim();
  const amount = Number(payload.amount);
  const category = String(payload.category || "").trim().toLowerCase();
  const note = String(payload.note || "").trim();
  const date = payload.date ? new Date(payload.date) : null;

  if (!title) {
    throw new AppError("Expense title is required.", 400);
  }

  if (Number.isNaN(amount) || amount <= 0) {
    throw new AppError("Expense amount must be greater than zero.", 400);
  }

  if (!PERSONAL_EXPENSE_CATEGORIES.includes(category)) {
    throw new AppError("Expense category is invalid.", 400);
  }

  if (!date || Number.isNaN(date.getTime())) {
    throw new AppError("A valid expense date is required.", 400);
  }

  return {
    title,
    amount: roundCurrency(amount),
    category,
    date,
    note
  };
};

const createPersonalExpense = asyncHandler(async (req, res) => {
  const expensePayload = validatePersonalExpenseInput(req.body);

  const expense = await PersonalExpense.create({
    user: req.user._id,
    ...expensePayload
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Personal expense added successfully.",
    data: {
      expense: formatPersonalExpense(expense)
    }
  });
});

const getPersonalExpenses = asyncHandler(async (req, res) => {
  const filters = {
    user: req.user._id
  };

  const selectedMonth = req.query.month ? parseMonthRange(req.query.month) : null;

  if (selectedMonth) {
    filters.date = {
      $gte: selectedMonth.startDate,
      $lt: selectedMonth.endDate
    };
  }

  if (req.query.category) {
    const category = String(req.query.category).trim().toLowerCase();

    if (!PERSONAL_EXPENSE_CATEGORIES.includes(category)) {
      throw new AppError("Personal expense category filter is invalid.", 400);
    }

    filters.category = category;
  }

  const expenses = await PersonalExpense.find(filters).sort({
    date: -1,
    createdAt: -1
  });

  sendSuccess(res, {
    message: "Personal expense history fetched successfully.",
    data: {
      expenses: expenses.map(formatPersonalExpense),
      totalCount: expenses.length,
      filters: {
        month: selectedMonth?.monthValue || "",
        category: filters.category || ""
      }
    }
  });
});

const updatePersonalExpense = asyncHandler(async (req, res) => {
  const expense = await PersonalExpense.findOne({
    _id: req.params.expenseId,
    user: req.user._id
  });

  if (!expense) {
    throw new AppError("Personal expense not found.", 404);
  }

  const expensePayload = validatePersonalExpenseInput(req.body);
  Object.assign(expense, expensePayload);
  await expense.save();

  sendSuccess(res, {
    message: "Personal expense updated successfully.",
    data: {
      expense: formatPersonalExpense(expense)
    }
  });
});

const deletePersonalExpense = asyncHandler(async (req, res) => {
  const expense = await PersonalExpense.findOne({
    _id: req.params.expenseId,
    user: req.user._id
  });

  if (!expense) {
    throw new AppError("Personal expense not found.", 404);
  }

  await expense.deleteOne();

  sendSuccess(res, {
    message: "Personal expense deleted successfully."
  });
});

const getPersonalExpenseSummary = asyncHandler(async (req, res) => {
  const currentMonth = parseMonthRange(getCurrentMonthValue());
  const selectedMonth = parseMonthRange(req.query.month || currentMonth.monthValue);

  const [currentMonthResult, selectedMonthResult, categoryBreakdown] = await Promise.all([
    PersonalExpense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: currentMonth.startDate,
            $lt: currentMonth.endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 }
        }
      }
    ]),
    PersonalExpense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: selectedMonth.startDate,
            $lt: selectedMonth.endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 }
        }
      }
    ]),
    PersonalExpense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: selectedMonth.startDate,
            $lt: selectedMonth.endDate
          }
        }
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 }
        }
      },
      {
        $sort: {
          totalAmount: -1
        }
      }
    ])
  ]);

  sendSuccess(res, {
    message: "Personal expense summary fetched successfully.",
    data: {
      currentMonth: currentMonth.monthValue,
      selectedMonth: selectedMonth.monthValue,
      currentMonthTotal: roundCurrency(currentMonthResult[0]?.totalAmount || 0),
      currentMonthCount: currentMonthResult[0]?.totalCount || 0,
      selectedMonthTotal: roundCurrency(selectedMonthResult[0]?.totalAmount || 0),
      selectedMonthCount: selectedMonthResult[0]?.totalCount || 0,
      categoryTotals: categoryBreakdown.map((item) => ({
        category: item._id,
        totalAmount: roundCurrency(item.totalAmount),
        totalCount: item.totalCount
      }))
    }
  });
});

const getPersonalExpenseAnalytics = asyncHandler(async (req, res) => {
  const { year, startDate, endDate } = getYearRange(req.query.year);

  const monthlyResults = await PersonalExpense.aggregate([
    {
      $match: {
        user: req.user._id,
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
        totalAmount: {
          $sum: "$amount"
        },
        totalCount: {
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
      totalAmount: roundCurrency(result?.totalAmount || 0),
      totalCount: result?.totalCount || 0
    };
  });

  const highestSpendingMonth = monthlyTotals.reduce(
    (highestMonth, month) => {
      if (month.totalAmount > highestMonth.totalAmount) {
        return month;
      }

      return highestMonth;
    },
    {
      month: 0,
      label: "N/A",
      totalAmount: 0,
      totalCount: 0
    }
  );

  sendSuccess(res, {
    message: "Personal expense analytics fetched successfully.",
    data: {
      year,
      totalYearSpend: roundCurrency(
        monthlyTotals.reduce((sum, month) => sum + month.totalAmount, 0)
      ),
      highestSpendingMonth,
      monthlyTotals
    }
  });
});

module.exports = {
  createPersonalExpense,
  deletePersonalExpense,
  getPersonalExpenseAnalytics,
  getPersonalExpenseSummary,
  getPersonalExpenses,
  updatePersonalExpense
};

