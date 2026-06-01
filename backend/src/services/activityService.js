const Activity = require("../models/Activity");

const logActivity = async ({ groupId, userId, type, message, metadata = {} }) => {
  return Activity.create({
    group: groupId,
    user: userId,
    type,
    message,
    metadata
  });
};

module.exports = {
  logActivity
};

