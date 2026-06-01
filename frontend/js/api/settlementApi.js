import { apiClient } from "./client.js";

export const getSettlements = (groupId) => apiClient.get(`/groups/${groupId}/settlements`);
export const createSettlement = (groupId, payload) =>
  apiClient.post(`/groups/${groupId}/settlements`, payload);

