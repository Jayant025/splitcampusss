const Group = require("../models/Group");
const AppError = require("../utils/appError");

const getMemberId = (member) => String(member.user?._id || member.user);

const findMemberRecord = (group, userId) => {
  return group.members.find((member) => getMemberId(member) === String(userId));
};

const isGroupMember = (group, userId) => Boolean(findMemberRecord(group, userId));

const isGroupAdmin = (group, userId) => {
  const member = findMemberRecord(group, userId);
  return Boolean(member && member.role === "admin");
};

const getGroupOrFail = async (groupId, populateMembers = true) => {
  let query = Group.findById(groupId).populate("createdBy", "name email profilePhoto");

  if (populateMembers) {
    query = query.populate("members.user", "name email profilePhoto");
  }

  const group = await query;

  if (!group) {
    throw new AppError("Group not found.", 404);
  }

  return group;
};

const ensureGroupMember = async (groupId, userId, options = {}) => {
  const populateMembers = options.populateMembers !== false;
  const group = await getGroupOrFail(groupId, populateMembers);

  if (!isGroupMember(group, userId)) {
    throw new AppError("You are not a member of this group.", 403);
  }

  return group;
};

const ensureGroupAdmin = async (groupId, userId, options = {}) => {
  const group = await ensureGroupMember(groupId, userId, options);

  if (!isGroupAdmin(group, userId)) {
    throw new AppError("Only a group admin can perform this action.", 403);
  }

  return group;
};

const touchGroup = async (groupId) => {
  await Group.findByIdAndUpdate(groupId, { $set: { updatedAt: new Date() } });
};

module.exports = {
  ensureGroupAdmin,
  ensureGroupMember,
  findMemberRecord,
  getMemberId,
  getGroupOrFail,
  isGroupAdmin,
  isGroupMember,
  touchGroup
};

