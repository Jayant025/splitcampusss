import { apiClient } from "./client.js";
import { buildQueryString } from "../utils/helpers.js";

export const getExpenses = (groupId, filters = {}) =>
  apiClient.get(`/groups/${groupId}/expenses${buildQueryString(filters)}`);

export const getExpense = (groupId, expenseId) =>
  apiClient.get(`/groups/${groupId}/expenses/${expenseId}`);

export const createExpense = (groupId, formData) =>
  apiClient.post(`/groups/${groupId}/expenses`, formData);

export const updateExpense = (groupId, expenseId, formData) =>
  apiClient.put(`/groups/${groupId}/expenses/${expenseId}`, formData);

export const deleteExpense = (groupId, expenseId) =>
  apiClient.delete(`/groups/${groupId}/expenses/${expenseId}`);

