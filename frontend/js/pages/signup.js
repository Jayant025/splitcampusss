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

  try {
    setButtonLoading(submitButton, true, "Creating account...");
    const data = await signupUser({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password")
    });

    saveSession(data);
    showToast("Account created successfully.");
    window.location.href = "/pages/dashboard.html";
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submitButton, false);
  }
});
