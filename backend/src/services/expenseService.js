const AppError = require("../utils/appError");
const { AVAILABLE_CATEGORIES, SPLIT_TYPES } = require("../utils/constants");
const { roundCurrency } = require("../utils/number");
const { parseJsonField } = require("../utils/validation");

const isAlmostEqual = (left, right) => Math.abs(left - right) <= 0.01;

const normalizeAmount = (value, fieldName) => {
  const amount = Number(value);

  if (Number.isNaN(amount) || amount <= 0) {
    throw new AppError(`${fieldName} must be a number greater than zero.`, 400);
  }

  return roundCurrency(amount);
};

const normalizeExpenseInput = ({ payload, groupMembers }) => {
  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();
  const paidBy = String(payload.paidBy || "");
  const category = String(payload.category || "").trim().toLowerCase();
  const customCategory = String(payload.customCategory || "").trim();
  const splitType = String(payload.splitType || "").trim().toLowerCase();
  const date = payload.date ? new Date(payload.date) : null;
  const amount = normalizeAmount(payload.amount, "Amount");

  if (!title) {
    throw new AppError("Expense title is required.", 400);
  }

  if (!date || Number.isNaN(date.getTime())) {
    throw new AppError("A valid expense date is required.", 400);
  }

  if (!AVAILABLE_CATEGORIES.includes(category)) {
    throw new AppError("Expense category is invalid.", 400);
  }

  if (category === "custom" && !customCategory) {
    throw new AppError("Custom category name is required.", 400);
  }

  if (!SPLIT_TYPES.includes(splitType)) {
    throw new AppError("Split type is invalid.", 400);
  }

  const groupMemberIds = new Set(groupMembers.map((member) => String(member.user)));

  if (!groupMemberIds.has(paidBy)) {
    throw new AppError("Paid by user must be a member of the selected group.", 400);
  }

  const splitMembers = parseJsonField(payload.splitMembers, "splitMembers");

  if (!Array.isArray(splitMembers) || splitMembers.length === 0) {
    throw new AppError("Split members are required.", 400);
  }

  const selectedMembers = splitMembers
    .map((member) => ({
      user: String(member.user || ""),
      amount: member.amount,
      percentage: member.percentage,
      selected: member.selected !== false
    }))
    .filter((member) => member.selected);

  if (selectedMembers.length === 0) {
    throw new AppError("Select at least one member for the split.", 400);
  }

  const uniqueMemberIds = new Set(selectedMembers.map((member) => member.user));

  if (uniqueMemberIds.size !== selectedMembers.length) {
    throw new AppError("A member can only appear once in the split list.", 400);
  }

  selectedMembers.forEach((member) => {
    if (!groupMemberIds.has(member.user)) {
      throw new AppError("Split members must belong to the selected group.", 400);
    }
  });

  let normalizedSplits = [];

  if (splitType === "equal") {
    const equalShare = roundCurrency(amount / selectedMembers.length);
    let runningTotal = 0;

    normalizedSplits = selectedMembers.map((member, index) => {
      const splitAmount =
        index === selectedMembers.length - 1
          ? roundCurrency(amount - runningTotal)
          : equalShare;

      runningTotal = roundCurrency(runningTotal + splitAmount);

      return {
        user: member.user,
        amount: splitAmount,
        percentage: roundCurrency((splitAmount / amount) * 100),
        selected: true
      };
    });
  }

  if (splitType === "exact") {
    normalizedSplits = selectedMembers.map((member) => {
      const splitAmount = normalizeAmount(member.amount, "Exact split amount");

      return {
        user: member.user,
        amount: splitAmount,
        percentage: roundCurrency((splitAmount / amount) * 100),
        selected: true
      };
    });

    const exactTotal = roundCurrency(
      normalizedSplits.reduce((sum, member) => sum + member.amount, 0)
    );

    if (!isAlmostEqual(exactTotal, amount)) {
      throw new AppError("Exact split amounts must add up to the total expense.", 400);
    }
  }

  if (splitType === "percentage") {
    let runningAmount = 0;
    let runningPercentage = 0;

    normalizedSplits = selectedMembers.map((member, index) => {
      const percentage = Number(member.percentage);

      if (Number.isNaN(percentage) || percentage <= 0) {
        throw new AppError("Percentage split values must be greater than zero.", 400);
      }

      const normalizedPercentage = roundCurrency(percentage);
      const splitAmount =
        index === selectedMembers.length - 1
          ? roundCurrency(amount - runningAmount)
          : roundCurrency((amount * normalizedPercentage) / 100);

      runningAmount = roundCurrency(runningAmount + splitAmount);
      runningPercentage = roundCurrency(runningPercentage + normalizedPercentage);

      return {
        user: member.user,
        amount: splitAmount,
        percentage: normalizedPercentage,
        selected: true
      };
    });

    if (!isAlmostEqual(runningPercentage, 100)) {
      throw new AppError("Percentage split values must add up to 100.", 400);
    }
  }

  return {
    title,
    amount,
    date,
    description,
    paidBy,
    category,
    customCategory: category === "custom" ? customCategory : "",
    splitType,
    splitMembers: normalizedSplits
  };
};

module.exports = {
  normalizeExpenseInput
};
