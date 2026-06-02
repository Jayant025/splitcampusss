import { apiClient } from "./client.js";
import { buildQueryString } from "../utils/helpers.js";

export const getPersonalExpenses = (filters = {}) =>
  apiClient.get(`/personal-expenses${buildQueryString(filters)}`);

export const createPersonalExpense = (payload) =>
  apiClient.post("/personal-expenses", payload);

export const updatePersonalExpense = (expenseId, payload) =>
  apiClient.put(`/personal-expenses/${expenseId}`, payload);

export const deletePersonalExpense = (expenseId) =>
  apiClient.delete(`/personal-expenses/${expenseId}`);

export const getPersonalExpenseSummary = (month) =>
  apiClient.get(`/personal-expenses/summary${buildQueryString({ month })}`);

export const getPersonalExpenseAnalytics = (year) =>
  apiClient.get(`/personal-expenses/analytics${buildQueryString({ year })}`);

