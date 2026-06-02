import { apiClient } from "./client.js";

export const getGroups = () => apiClient.get("/groups");
export const createGroup = (formData) => apiClient.post("/groups", formData);
export const getGroup = (groupId) => apiClient.get(`/groups/${groupId}`);
export const updateGroup = (groupId, formData) => apiClient.put(`/groups/${groupId}`, formData);
export const joinGroup = (payload) => apiClient.post("/groups/join", payload);
export const addMember = (groupId, payload) => apiClient.post(`/groups/${groupId}/members`, payload);
export const removeMember = (groupId, userId) => apiClient.delete(`/groups/${groupId}/members/${userId}`);
export const leaveGroup = (groupId) => apiClient.post(`/groups/${groupId}/leave`, {});
export const getGroupDashboard = (groupId) => apiClient.get(`/groups/${groupId}/dashboard`);
export const getGroupBalances = (groupId) => apiClient.get(`/groups/${groupId}/balances`);

