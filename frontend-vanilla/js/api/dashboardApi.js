import { apiClient } from "./client.js";

export const getPersonalDashboard = () => apiClient.get("/dashboard/personal");

