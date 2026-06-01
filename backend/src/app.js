const path = require("path");

const cors = require("cors");
const express = require("express");
const morgan = require("morgan");

const analyticsRoutes = require("./routes/analyticsRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const groupRoutes = require("./routes/groupRoutes");
const personalExpenseRoutes = require("./routes/personalExpenseRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SplitCampus API is healthy"
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/groups", expenseRoutes);
app.use("/api/groups", settlementRoutes);
app.use("/api/groups", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/personal-expenses", personalExpenseRoutes);

app.use(express.static(path.join(__dirname, "../../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
