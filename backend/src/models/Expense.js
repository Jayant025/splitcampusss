const mongoose = require("mongoose");

const { AVAILABLE_CATEGORIES, SPLIT_TYPES } = require("../utils/constants");

const expenseSplitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0
    },
    selected: {
      type: Boolean,
      default: true
    }
  },
  {
    _id: false
  }
);

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
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
    date: {
      type: Date,
      required: [true, "Expense date is required."]
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category: {
      type: String,
      enum: AVAILABLE_CATEGORIES,
      required: [true, "Expense category is required."]
    },
    customCategory: {
      type: String,
      default: "",
      trim: true
    },
    receiptImage: {
      type: String,
      default: ""
    },
    splitType: {
      type: String,
      enum: SPLIT_TYPES,
      required: [true, "Split type is required."]
    },
    splitMembers: [expenseSplitSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ group: 1, date: -1 });
expenseSchema.index({ group: 1, category: 1 });

module.exports = mongoose.model("Expense", expenseSchema);

