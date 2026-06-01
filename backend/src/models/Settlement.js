const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: [true, "Settlement amount is required."],
      min: 0.01
    },
    note: {
      type: String,
      default: "",
      trim: true
    },
    date: {
      type: Date,
      required: [true, "Settlement date is required."]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

settlementSchema.index({ group: 1, date: -1 });

module.exports = mongoose.model("Settlement", settlementSchema);

