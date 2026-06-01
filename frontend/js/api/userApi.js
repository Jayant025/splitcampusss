import { apiClient } from "./client.js";

export const getProfile = () => apiClient.get("/users/profile");
export const updateProfile = (formData) => apiClient.put("/users/profile", formData);
export const changePassword = (payload) => apiClient.put("/users/password", payload);

