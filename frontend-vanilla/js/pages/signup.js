import { signupUser } from "../api/authApi.js";
import { setButtonLoading, showToast } from "../components/ui.js";
import { saveSession } from "../utils/auth.js";
import { redirectIfAuthenticated } from "../utils/guards.js";
import { mountThemeToggle } from "../utils/theme.js";

redirectIfAuthenticated();
mountThemeToggle();

const form = document.getElementById("signupForm");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = form.querySelector('button[type="submit"]');
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  // Client-side validations
  if (name.length < 2) {
    showToast("Please enter your name (minimum 2 characters).", "error");
    return;
  }

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
    setButtonLoading(submitButton, true, "Creating account...");
    const data = await signupUser({
      name,
      email,
      password
    });

    saveSession(data);
    showToast("Welcome to SplitCampus! Account created. 🎉");
    window.location.href = "/pages/dashboard.html";
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});
