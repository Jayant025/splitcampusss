const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { buildFileUrl } = require("../middleware/uploadMiddleware");
const { sendSuccess } = require("../utils/response");
const { validateEmail, validatePassword } = require("../utils/validation");

const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: "Profile fetched successfully.",
    data: {
      user: req.user.getPublicProfile()
    }
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const name = String(req.body.name || req.user.name).trim();
  const email = String(req.body.email || req.user.email)
    .trim()
    .toLowerCase();

  if (!name) {
    throw new AppError("Name is required.", 400);
  }

  if (!validateEmail(email)) {
    throw new AppError("Please provide a valid email address.", 400);
  }

  if (email !== req.user.email) {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError("This email is already in use by another account.", 400);
    }
  }

  req.user.name = name;
  req.user.email = email;

  if (req.file) {
    req.user.profilePhoto = buildFileUrl("profiles", req.file);
  }

  await req.user.save();

  sendSuccess(res, {
    message: "Profile updated successfully.",
    data: {
      user: req.user.getPublicProfile()
    }
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!currentPassword || !validatePassword(newPassword)) {
    throw new AppError("Please provide your current password and a valid new password.", 400);
  }

  const userWithPassword = await User.findById(req.user._id).select("+password");

  if (!(await userWithPassword.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect.", 400);
  }

  userWithPassword.password = newPassword;
  await userWithPassword.save();

  sendSuccess(res, {
    message: "Password changed successfully."
  });
});

module.exports = {
  changePassword,
  getProfile,
  updateProfile
};

