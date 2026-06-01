const GROUP_TYPES = ["hostel", "trip", "flat", "event"];
const DEFAULT_CATEGORIES = [
  "food",
  "rent",
  "wifi",
  "electricity",
  "grocery",
  "travel",
  "miscellaneous"
];
const AVAILABLE_CATEGORIES = [...DEFAULT_CATEGORIES, "custom"];
const PERSONAL_EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "bills",
  "entertainment",
  "health",
  "education",
  "miscellaneous"
];
const SPLIT_TYPES = ["equal", "exact", "percentage"];
const MEMBER_ROLES = ["admin", "member"];
const ACTIVITY_TYPES = [
  "group_created",
  "group_updated",
  "member_added",
  "member_removed",
  "member_joined",
  "member_left",
  "expense_added",
  "expense_updated",
  "expense_deleted",
  "settlement_added"
];

module.exports = {
  ACTIVITY_TYPES,
  AVAILABLE_CATEGORIES,
  DEFAULT_CATEGORIES,
  GROUP_TYPES,
  MEMBER_ROLES,
  PERSONAL_EXPENSE_CATEGORIES,
  SPLIT_TYPES
};
