import { apiClient } from "./client.js";

export const getMonthlyAnalytics = (groupId, year) =>
  apiClient.get(`/groups/${groupId}/analytics/monthly?year=${year}`);

