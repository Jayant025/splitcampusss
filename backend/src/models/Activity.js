const mongoose = require("mongoose");

const { ACTIVITY_TYPES } = require("../utils/constants");

const activitySchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
