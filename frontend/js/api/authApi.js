import { apiClient } from "./client.js";

export const signupUser = (payload) => apiClient.post("/auth/signup", payload);
export const loginUser = (payload) => apiClient.post("/auth/login", payload);
export const logoutUser = () => apiClient.post("/auth/logout", {});
export const getCurrentUser = () => apiClient.get("/auth/me");

