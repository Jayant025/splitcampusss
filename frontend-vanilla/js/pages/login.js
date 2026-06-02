import { loginUser } from "../api/authApi.js";
import { setButtonLoading, showToast } from "../components/ui.js";
import { saveSession } from "../utils/auth.js";
import { redirectIfAuthenticated } from "../utils/guards.js";
import { mountThemeToggle } from "../utils/theme.js";

redirectIfAuthenticated();
mountThemeToggle();

const form = document.getElementById("loginForm");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  // Client-side validations
  if (!email) {
    showToast("Please enter your email address.", "error");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address.", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters long.", "error");
    return;
  }

  try {
    setButtonLoading(submitButton, true, "Logging in...");
    const data = await loginUser({
      email,
      password
    });

    saveSession(data);
    showToast("Welcome back! Login successful. 🎉");
    window.location.href = "/pages/dashboard.html";
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});
