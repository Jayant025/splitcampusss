const Expense = require("../models/Expense");
const { buildFileUrl } = require("../middleware/uploadMiddleware");
const { logActivity } = require("../services/activityService");
const { normalizeExpenseInput } = require("../services/expenseService");
const {
  ensureGroupMember,
  getGroupOrFail,
  isGroupAdmin,
  touchGroup
} = require("../services/groupService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { sendSuccess } = require("../utils/response");
const { isValidObjectId } = require("../utils/validation");

const formatMiniUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    _id: user._id || user,
    name: user.name || "",
    email: user.email || "",
    profilePhoto: user.profilePhoto || ""
  };
};

const formatExpense = (expense) => ({
  _id: expense._id,
  group: expense.group,
  title: expense.title,
  amount: expense.amount,
  date: expense.date,
  description: expense.description,
  paidBy: formatMiniUser(expense.paidBy),
  category: expense.category,
  customCategory: expense.customCategory,
  categoryLabel: expense.category === "custom" ? expense.customCategory : expense.category,
  receiptImage: expense.receiptImage,
  splitType: expense.splitType,
  splitMembers: expense.splitMembers.map((member) => ({
    user: formatMiniUser(member.user),
    amount: member.amount,
    percentage: member.percentage,
    selected: member.selected
  })),
  createdBy: formatMiniUser(expense.createdBy),
  updatedBy: formatMiniUser(expense.updatedBy),
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt
});

const getExpenseQuery = (query) => {
  const sortMap = {
    latest: { date: -1, createdAt: -1 },
    oldest: { date: 1, createdAt: 1 },
    highest: { amount: -1, date: -1 },
    lowest: { amount: 1, date: -1 }
  };

  return sortMap[query.sort] || sortMap.latest;
};

const createExpense = asyncHandler(async (req, res) => {
  const group = await ensureGroupMember(req.params.groupId, req.user._id, {
    populateMembers: false
  });
  const expensePayload = normalizeExpenseInput({
    payload: req.body,
    groupMembers: group.members
  });

  const expense = await Expense.create({
    ...expensePayload,
    group: group._id,
    receiptImage: buildFileUrl("receipts", req.file),
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await touchGroup(group._id);
  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "expense_added",
    message: `${req.user.name} added the expense ${expense.title}.`,
    metadata: {
      expenseId: expense._id
    }
  });

  const populatedExpense = await Expense.findById(expense._id)
    .populate("paidBy", "name email profilePhoto")
    .populate("splitMembers.user", "name email profilePhoto")
    .populate("createdBy", "name email profilePhoto")
    .populate("updatedBy", "name email profilePhoto");

  sendSuccess(res, {
    statusCode: 201,
    message: "Expense added successfully.",
    data: {
      expense: formatExpense(populatedExpense)
    }
  });
});

const getExpenses = asyncHandler(async (req, res) => {
  await ensureGroupMember(req.params.groupId, req.user._id, {
    populateMembers: false
  });

  const filters = {
    group: req.params.groupId
  };

  if (req.query.search) {
    filters.title = {
      $regex: req.query.search,
      $options: "i"
    };
  }

  if (req.query.category) {
    filters.category = req.query.category;
  }

  if (req.query.member && isValidObjectId(req.query.member)) {
    filters.$or = [{ paidBy: req.query.member }, { "splitMembers.user": req.query.member }];
  }

  if (req.query.startDate || req.query.endDate) {
    filters.date = {};

    if (req.query.startDate) {
      filters.date.$gte = new Date(req.query.startDate);
    }

    if (req.query.endDate) {
      filters.date.$lte = new Date(req.query.endDate);
    }
  }

  const expenses = await Expense.find(filters)
    .populate("paidBy", "name email profilePhoto")
    .populate("splitMembers.user", "name email profilePhoto")
    .populate("createdBy", "name email profilePhoto")
    .populate("updatedBy", "name email profilePhoto")
    .sort(getExpenseQuery(req.query));

  sendSuccess(res, {
    message: "Expenses fetched successfully.",
    data: {
      expenses: expenses.map(formatExpense),
      totalCount: expenses.length
    }
  });
});

const getExpenseById = asyncHandler(async (req, res) => {
  await ensureGroupMember(req.params.groupId, req.user._id, {
    populateMembers: false
  });

  const expense = await Expense.findOne({
    _id: req.params.expenseId,
    group: req.params.groupId
  })
    .populate("paidBy", "name email profilePhoto")
    .populate("splitMembers.user", "name email profilePhoto")
    .populate("createdBy", "name email profilePhoto")
    .populate("updatedBy", "name email profilePhoto");

  if (!expense) {
    throw new AppError("Expense not found.", 404);
  }

  sendSuccess(res, {
    message: "Expense fetched successfully.",
    data: {
      expense: formatExpense(expense)
    }
  });
});

const updateExpense = asyncHandler(async (req, res) => {
  const group = await getGroupOrFail(req.params.groupId, false);

  if (!group.members.some((member) => String(member.user) === String(req.user._id))) {
    throw new AppError("You are not a member of this group.", 403);
  }

  const expense = await Expense.findOne({
    _id: req.params.expenseId,
    group: req.params.groupId
  });

  if (!expense) {
    throw new AppError("Expense not found.", 404);
  }

  const canManageExpense =
    String(expense.createdBy) === String(req.user._id) || isGroupAdmin(group, req.user._id);

  if (!canManageExpense) {
    throw new AppError("Only the expense creator or a group admin can edit this expense.", 403);
  }

  const expensePayload = normalizeExpenseInput({
    payload: req.body,
    groupMembers: group.members
  });

  Object.assign(expense, expensePayload, {
    updatedBy: req.user._id
  });

  if (req.file) {
    expense.receiptImage = buildFileUrl("receipts", req.file);
  }

  await expense.save();
  await touchGroup(group._id);
  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "expense_updated",
    message: `${req.user.name} updated the expense ${expense.title}.`,
    metadata: {
      expenseId: expense._id
    }
  });

  const populatedExpense = await Expense.findById(expense._id)
    .populate("paidBy", "name email profilePhoto")
    .populate("splitMembers.user", "name email profilePhoto")
    .populate("createdBy", "name email profilePhoto")
    .populate("updatedBy", "name email profilePhoto");

  sendSuccess(res, {
    message: "Expense updated successfully.",
    data: {
      expense: formatExpense(populatedExpense)
    }
  });
});

const deleteExpense = asyncHandler(async (req, res) => {
  const group = await getGroupOrFail(req.params.groupId, false);

  if (!group.members.some((member) => String(member.user) === String(req.user._id))) {
    throw new AppError("You are not a member of this group.", 403);
  }

  const expense = await Expense.findOne({
    _id: req.params.expenseId,
    group: req.params.groupId
  });

  if (!expense) {
    throw new AppError("Expense not found.", 404);
  }

  const canManageExpense =
    String(expense.createdBy) === String(req.user._id) || isGroupAdmin(group, req.user._id);

  if (!canManageExpense) {
    throw new AppError("Only the expense creator or a group admin can delete this expense.", 403);
  }

  const expenseTitle = expense.title;
  await expense.deleteOne();
  await touchGroup(group._id);
  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "expense_deleted",
    message: `${req.user.name} deleted the expense ${expenseTitle}.`,
    metadata: {
      expenseId: req.params.expenseId
    }
  });

  sendSuccess(res, {
    message: "Expense deleted successfully."
  });
});

module.exports = {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  updateExpense
};

