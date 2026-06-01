const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required.", 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new AppError("Authentication token is missing.", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError("The user linked to this token no longer exists.", 401);
  }

  req.user = user;
  req.token = token;
  next();
});

module.exports = {
  protect
};

