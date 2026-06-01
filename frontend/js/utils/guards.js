import { isAuthenticated } from "./auth.js";

export const requireAuth = () => {
  if (!isAuthenticated()) {
    window.location.href = "/pages/login.html";
    return false;
  }

  return true;
};

export const redirectIfAuthenticated = () => {
  if (isAuthenticated()) {
    window.location.href = "/pages/dashboard.html";
  }
};

