const Activity = require("../models/Activity");
const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
const Settlement = require("../models/Settlement");
const { buildFileUrl } = require("../middleware/uploadMiddleware");
const { logActivity } = require("../services/activityService");
const { calculateGroupBalances } = require("../services/balanceService");
const {
  ensureGroupAdmin,
  ensureGroupMember,
  findMemberRecord,
  getGroupOrFail,
  getMemberId
} = require("../services/groupService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { GROUP_TYPES } = require("../utils/constants");
const { roundCurrency } = require("../utils/number");
const { sendSuccess } = require("../utils/response");
const { isValidObjectId, validateEmail } = require("../utils/validation");

const formatMember = (member) => ({
  userId: String(member.user?._id || member.user),
  name: member.user?.name || "",
  email: member.user?.email || "",
  profilePhoto: member.user?.profilePhoto || "",
  role: member.role,
  joinedAt: member.joinedAt
});

const formatGroup = (group, extras = {}) => ({
  _id: group._id,
  name: group.name,
  description: group.description,
  type: group.type,
  image: group.image,
  inviteCode: group.inviteCode,
  createdBy: group.createdBy
    ? {
        _id: group.createdBy._id,
        name: group.createdBy.name,
        email: group.createdBy.email,
        profilePhoto: group.createdBy.profilePhoto
      }
    : null,
  members: group.members.map(formatMember),
  memberCount: group.members.length,
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
  ...extras
});

const createGroup = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();
  const type = String(req.body.type || "").trim().toLowerCase();

  if (!name) {
    throw new AppError("Group name is required.", 400);
  }

  if (!GROUP_TYPES.includes(type)) {
    throw new AppError("Group type is invalid.", 400);
  }

  const group = await Group.create({
    name,
    description,
    type,
    image: buildFileUrl("groups", req.file),
    createdBy: req.user._id,
    members: [
      {
        user: req.user._id,
        role: "admin"
      }
    ]
  });

  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "group_created",
    message: `${req.user.name} created the group ${group.name}.`
  });

  const populatedGroup = await getGroupOrFail(group._id);

  sendSuccess(res, {
    statusCode: 201,
    message: "Group created successfully.",
    data: {
      group: formatGroup(populatedGroup)
    }
  });
});

const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ "members.user": req.user._id })
    .populate("createdBy", "name email profilePhoto")
    .populate("members.user", "name email profilePhoto")
    .sort({ updatedAt: -1 });

  const groupIds = groups.map((group) => group._id);

  const expenseSummaries = groupIds.length
    ? await Expense.aggregate([
        {
          $match: {
            group: {
              $in: groupIds
            }
          }
        },
        {
          $group: {
            _id: "$group",
            totalExpenses: {
              $sum: "$amount"
            },
            expenseCount: {
              $sum: 1
            }
          }
        }
      ])
    : [];

  const summaryMap = new Map(
    expenseSummaries.map((item) => [
      String(item._id),
      {
        totalExpenses: roundCurrency(item.totalExpenses),
        expenseCount: item.expenseCount
      }
    ])
  );

  const result = groups.map((group) => {
    const currentMember = findMemberRecord(group, req.user._id);
    const summary = summaryMap.get(String(group._id)) || {
      totalExpenses: 0,
      expenseCount: 0
    };

    return formatGroup(group, {
      currentUserRole: currentMember?.role || "member",
      totalExpenses: summary.totalExpenses,
      expenseCount: summary.expenseCount
    });
  });

  sendSuccess(res, {
    message: "Groups fetched successfully.",
    data: {
      groups: result
    }
  });
});

const getGroupById = asyncHandler(async (req, res) => {
  const group = await ensureGroupMember(req.params.groupId, req.user._id);
  const expenseSummary = await Expense.aggregate([
    {
      $match: {
        group: group._id
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: {
          $sum: "$amount"
        },
        expenseCount: {
          $sum: 1
        }
      }
    }
  ]);

  const summary = expenseSummary[0] || {
    totalExpenses: 0,
    expenseCount: 0
  };

  sendSuccess(res, {
    message: "Group details fetched successfully.",
    data: {
      group: formatGroup(group, {
        totalExpenses: roundCurrency(summary.totalExpenses),
        expenseCount: summary.expenseCount
      })
    }
  });
});

const updateGroup = asyncHandler(async (req, res) => {
  const group = await ensureGroupAdmin(req.params.groupId, req.user._id, {
    populateMembers: false
  });

  const name = req.body.name !== undefined ? String(req.body.name).trim() : group.name;
  const description =
    req.body.description !== undefined ? String(req.body.description).trim() : group.description;
  const type = req.body.type !== undefined ? String(req.body.type).trim().toLowerCase() : group.type;

  if (!name) {
    throw new AppError("Group name is required.", 400);
  }

  if (!GROUP_TYPES.includes(type)) {
    throw new AppError("Group type is invalid.", 400);
  }

  group.name = name;
  group.description = description;
  group.type = type;

  if (req.file) {
    group.image = buildFileUrl("groups", req.file);
  }

  await group.save();

  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "group_updated",
    message: `${req.user.name} updated the group details.`
  });

  const populatedGroup = await getGroupOrFail(group._id);

  sendSuccess(res, {
    message: "Group updated successfully.",
    data: {
      group: formatGroup(populatedGroup)
    }
  });
});

const joinGroupByInviteCode = asyncHandler(async (req, res) => {
  const inviteCode = String(req.body.inviteCode || "")
    .trim()
    .toUpperCase();

  if (!inviteCode) {
    throw new AppError("Invite code is required.", 400);
  }

  const group = await Group.findOne({ inviteCode });

  if (!group) {
    throw new AppError("Invalid invite code.", 404);
  }

  if (findMemberRecord(group, req.user._id)) {
    throw new AppError("You are already a member of this group.", 400);
  }

  group.members.push({
    user: req.user._id,
    role: "member"
  });

  await group.save();

  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "member_joined",
    message: `${req.user.name} joined the group using the invite code.`
  });

  const populatedGroup = await getGroupOrFail(group._id);

  sendSuccess(res, {
    message: "Joined group successfully.",
    data: {
      group: formatGroup(populatedGroup)
    }
  });
});

const addMemberByEmail = asyncHandler(async (req, res) => {
  const group = await ensureGroupAdmin(req.params.groupId, req.user._id, {
    populateMembers: false
  });
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  if (!validateEmail(email)) {
    throw new AppError("Please provide a valid email address.", 400);
  }

  const userToAdd = await User.findOne({ email });

  if (!userToAdd) {
    throw new AppError("No user account found with that email.", 404);
  }

  if (String(userToAdd._id) === String(req.user._id)) {
    throw new AppError("You are already part of this group.", 400);
  }

  if (group.members.some((member) => getMemberId(member) === String(userToAdd._id))) {
    throw new AppError("This user is already a member of the group.", 400);
  }

  group.members.push({
    user: userToAdd._id,
    role: "member"
  });

  await group.save();

  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "member_added",
    message: `${req.user.name} added ${userToAdd.name} to the group.`,
    metadata: {
      memberId: userToAdd._id
    }
  });

  const populatedGroup = await getGroupOrFail(group._id);

  sendSuccess(res, {
    message: "Member added successfully.",
    data: {
      group: formatGroup(populatedGroup)
    }
  });
});

const removeMember = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.userId)) {
    throw new AppError("Invalid user id.", 400);
  }

  if (String(req.params.userId) === String(req.user._id)) {
    throw new AppError("Use the leave group action to remove yourself.", 400);
  }

  const group = await ensureGroupAdmin(req.params.groupId, req.user._id, {
    populateMembers: false
  });
  const memberToRemove = findMemberRecord(group, req.params.userId);

  if (!memberToRemove) {
    throw new AppError("Member not found in this group.", 404);
  }

  const userToRemove = await User.findById(req.params.userId).select("name");
  const removedUserName = userToRemove?.name || "member";
  group.members = group.members.filter((member) => getMemberId(member) !== String(req.params.userId));
  await group.save();

  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "member_removed",
    message: `${req.user.name} removed ${removedUserName} from the group.`,
    metadata: {
      memberId: req.params.userId
    }
  });

  const updatedGroup = await getGroupOrFail(group._id);

  sendSuccess(res, {
    message: "Member removed successfully.",
    data: {
      group: formatGroup(updatedGroup)
    }
  });
});

const leaveGroup = asyncHandler(async (req, res) => {
  const group = await ensureGroupMember(req.params.groupId, req.user._id, {
    populateMembers: false
  });
  const memberRecord = findMemberRecord(group, req.user._id);

  if (group.members.length === 1) {
    throw new AppError("You cannot leave a group if you are the only member.", 400);
  }

  group.members = group.members.filter((member) => getMemberId(member) !== String(req.user._id));

  let promotedAdmin = null;

  if (memberRecord.role === "admin" && group.members.length > 0) {
    group.members[0].role = "admin";
    promotedAdmin = group.members[0].user;
  }

  await group.save();

  await logActivity({
    groupId: group._id,
    userId: req.user._id,
    type: "member_left",
    message: `${req.user.name} left the group.`,
    metadata: promotedAdmin
      ? {
          promotedAdminId: promotedAdmin._id || promotedAdmin
        }
      : {}
  });

  sendSuccess(res, {
    message: "You left the group successfully.",
    data: {
      groupId: group._id
    }
  });
});

const getGroupDashboard = asyncHandler(async (req, res) => {
  const group = await ensureGroupMember(req.params.groupId, req.user._id);
  const balances = await calculateGroupBalances(req.params.groupId);

  const recentActivity = await Activity.find({ group: req.params.groupId })
    .populate("user", "name email profilePhoto")
    .sort({ createdAt: -1 })
    .limit(10);

  const recentExpenses = await Expense.find({ group: req.params.groupId })
    .populate("paidBy", "name email profilePhoto")
    .sort({ date: -1, createdAt: -1 })
    .limit(5);

  sendSuccess(res, {
    message: "Group dashboard fetched successfully.",
    data: {
      group: formatGroup(group),
      summary: balances.summary,
      balances: balances.members,
      simplifiedDebts: balances.simplifiedDebts,
      recentExpenses,
      recentActivity
    }
  });
});

const getGroupBalances = asyncHandler(async (req, res) => {
  await ensureGroupMember(req.params.groupId, req.user._id, {
    populateMembers: false
  });

  const balances = await calculateGroupBalances(req.params.groupId);
  const currentUserBalance =
    balances.members.find((member) => member.userId === String(req.user._id)) || null;

  sendSuccess(res, {
    message: "Group balances fetched successfully.",
    data: {
      ...balances,
      currentUserBalance
    }
  });
});

const deleteGroup = asyncHandler(async (req, res) => {
  const group = await ensureGroupAdmin(req.params.groupId, req.user._id, {
    populateMembers: false
  });

  const groupId = group._id;

  await Promise.all([
    Expense.deleteMany({ group: groupId }),
    Settlement.deleteMany({ group: groupId }),
    Activity.deleteMany({ group: groupId }),
    Group.findByIdAndDelete(groupId)
  ]);

  sendSuccess(res, {
    message: "Group and all its associated expenses, settlements, and activities deleted successfully.",
    data: {
      groupId
    }
  });
});

module.exports = {
  addMemberByEmail,
  createGroup,
  deleteGroup,
  getGroupBalances,
  getGroupById,
  getGroupDashboard,
  getGroups,
  joinGroupByInviteCode,
  leaveGroup,
  removeMember,
  updateGroup
};
