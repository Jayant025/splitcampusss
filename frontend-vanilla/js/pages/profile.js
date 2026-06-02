import { changePassword, getProfile, updateProfile } from "../api/userApi.js";
import { renderAppLayout } from "../components/layout.js";
import { renderState, setButtonLoading, showToast } from "../components/ui.js";
import { updateStoredUser } from "../utils/auth.js";
import { escapeHtml, formatDate } from "../utils/helpers.js";
import { requireAuth } from "../utils/guards.js";

if (requireAuth()) {
  renderAppLayout({
    title: "Profile",
    subtitle: "Manage the identity details that appear across your SplitCampus groups.",
    activeNav: "profile"
  });

  const profileSummary = document.getElementById("profileSummary");
  const profileForm = document.getElementById("profileForm");
  const passwordForm = document.getElementById("passwordForm");

  const renderProfileSummary = (user) => {
    profileSummary.innerHTML = `
      <div class="profile-summary">
        ${
          user.profilePhoto
            ? `<img class="profile-avatar" src="${escapeHtml(user.profilePhoto)}" alt="${escapeHtml(
                user.name
              )}" />`
            : `<div class="profile-avatar avatar-fallback">${escapeHtml(
                user.name.slice(0, 2).toUpperCase()
              )}</div>`
        }
        <div>
          <strong>${escapeHtml(user.name)}</strong>
          <div class="item-meta">${escapeHtml(user.email)}</div>
          <div class="item-meta">Joined on ${formatDate(user.createdAt)}</div>
        </div>
      </div>
    `;
  };

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      const { user } = data;
      renderProfileSummary(user);
      profileForm.name.value = user.name;
      profileForm.email.value = user.email;
    } catch (error) {
      showToast(error.message, "error");
      renderState(profileSummary, "Profile unavailable", "Could not load your profile right now.");
    }
  };

  profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = profileForm.querySelector('button[type="submit"]');
    const formData = new FormData(profileForm);

    try {
      setButtonLoading(submitButton, true, "Saving...");
      const data = await updateProfile(formData);
      updateStoredUser(data.user);
      renderProfileSummary(data.user);
      showToast("Profile updated successfully.");
      profileForm.profilePhoto.value = "";
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = passwordForm.querySelector('button[type="submit"]');
    const formData = new FormData(passwordForm);

    try {
      setButtonLoading(submitButton, true, "Updating...");
      await changePassword({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword")
      });
      passwordForm.reset();
      showToast("Password changed successfully.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  loadProfile();
}

