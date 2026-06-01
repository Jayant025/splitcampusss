const AppError = require("../utils/appError");

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Something went wrong on the server.";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (error.code === 11000) {
    statusCode = 400;
    message = `${Object.keys(error.keyValue)[0]} already exists.`;
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource id.";
  }

  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token.";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired. Please log in again.";
  }

  if (error.name === "MulterError") {
    statusCode = 400;
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined
  });
};

module.exports = {
  notFound,
  errorHandler
};

