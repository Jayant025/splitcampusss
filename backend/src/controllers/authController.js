const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { sendSuccess } = require("../utils/response");
const { generateToken } = require("../utils/token");
const { validateEmail, validatePassword } = require("../utils/validation");

const buildAuthPayload = (user) => ({
  token: generateToken(user._id),
  user: user.getPublicProfile()
});

const signup = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !validateEmail(email) || !validatePassword(password)) {
    throw new AppError("Please provide a valid name, email, and password.", 400);
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("An account with this email already exists.", 400);
  }

  const user = await User.create({
    name,
    email,
    password
  });

  sendSuccess(res, {
    statusCode: 201,
    message: "Account created successfully.",
    data: buildAuthPayload(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");

  if (!validateEmail(email) || !password) {
    throw new AppError("Please provide a valid email and password.", 400);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  sendSuccess(res, {
    message: "Login successful.",
    data: buildAuthPayload(user)
  });
});

const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: "Logout successful."
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: "Current user fetched successfully.",
    data: {
      user: req.user.getPublicProfile()
    }
  });
});

module.exports = {
  getCurrentUser,
  login,
  logout,
  signup
};

