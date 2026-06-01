const mongoose = require("mongoose");

const AppError = require("./appError");

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").toLowerCase());
};

const validatePassword = (password) => {
  return typeof password === "string" && password.trim().length >= 6;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseJsonField = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new AppError(`${fieldName} must be valid JSON.`, 400);
  }
};

module.exports = {
  isValidObjectId,
  parseJsonField,
  validateEmail,
  validatePassword
};
