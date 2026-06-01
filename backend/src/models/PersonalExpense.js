const mongoose = require("mongoose");

const { PERSONAL_EXPENSE_CATEGORIES } = require("../utils/constants");

const personalExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: [true, "Expense title is required."],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required."],
      min: 0.01
    },
    category: {
      type: String,
      enum: PERSONAL_EXPENSE_CATEGORIES,
      required: [true, "Expense category is required."]
    },
    date: {
      type: Date,
      required: [true, "Expense date is required."]
    },
    note: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

personalExpenseSchema.index({ user: 1, date: -1 });
personalExpenseSchema.index({ user: 1, category: 1, date: -1 });

module.exports = mongoose.model("PersonalExpense", personalExpenseSchema);

