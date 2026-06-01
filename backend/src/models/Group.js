const crypto = require("crypto");

const mongoose = require("mongoose");

const { GROUP_TYPES, MEMBER_ROLES } = require("../utils/constants");

const groupMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: MEMBER_ROLES,
      default: "member"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required."],
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    type: {
      type: String,
      enum: GROUP_TYPES,
      required: [true, "Group type is required."]
    },
    image: {
      type: String,
      default: ""
    },
    inviteCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [groupMemberSchema]
  },
  {
    timestamps: true
  }
);

groupSchema.pre("validate", function createInviteCode(next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  }

  next();
});

module.exports = mongoose.model("Group", groupSchema);

