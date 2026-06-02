import { logoutUser } from "../api/authApi.js";
import { clearSession, getStoredUser } from "../utils/auth.js";
import { escapeHtml, getInitials } from "../utils/helpers.js";
import { mountThemeToggle } from "../utils/theme.js";
import { showToast } from "./ui.js";

const navItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/pages/dashboard.html"
  },
  {
    key: "groups",
    label: "Groups",
    href: "/pages/groups.html"
  },
  {
    key: "personal-expenses",
    label: "Personal Expenses",
    href: "/personal-expenses/index.html"
  },
  {
    key: "profile",
    label: "Profile",
    href: "/pages/profile.html"
  }
];

const getAvatarMarkup = (user) => {
  if (user?.profilePhoto) {
    return `<img class="profile-avatar" src="${escapeHtml(user.profilePhoto)}" alt="${escapeHtml(
      user.name
    )}" />`;
  }

  return `<div class="profile-avatar avatar-fallback">${escapeHtml(getInitials(user?.name || "U"))}</div>`;
};

const campusTips = [
  "Split Maggi fairly. Roommate friendships depend on it! 🍜",
  "Screenshots of receipts disappear. Shared expense records don't! 📸",
  "Settle cab rides before placement season starts. 🚕",
  "Cleaning duty ignored? Future roommate arguments detected! 🧹",
  "Roommate rule #1: If you pay for the tea, it's tea. If you pay for dinner, log it here. ☕",
  "Keep your receipt photos clear. No one likes a blurry check. 📸",
  "Don't worry, personal expenses are kept 100% private from your groups. 😉"
];

export const renderAppLayout = ({
  title,
  subtitle = "",
  activeNav = "dashboard",
  actionsHtml = ""
}) => {
  const user = getStoredUser();
  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("topbar");

  if (sidebar) {
    const randomTip = campusTips[Math.floor(Math.random() * campusTips.length)];
    sidebar.innerHTML = `
      <div class="sidebar-panel">
        <a class="brand" href="/pages/dashboard.html">SplitCampus</a>
        <nav class="sidebar-nav">
          ${navItems
            .map(
              (item) => `
                <a class="nav-link ${item.key === activeNav ? "active" : ""}" href="${item.href}">
                  <span>${escapeHtml(item.label)}</span>
                </a>
              `
            )
            .join("")}
        </nav>
        <div class="card soft-card">
          <strong>Campus Pro-Tip 💡</strong>
          <p class="muted-text">${escapeHtml(randomTip)}</p>
        </div>
        <div class="sidebar-footer">
          <button class="btn btn-ghost btn-block" id="logoutButtonSidebar" type="button">Logout</button>
        </div>
      </div>
    `;
  }

  if (topbar) {
    topbar.innerHTML = `
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <div class="topbar-actions">
        ${actionsHtml}
        <div id="topbarThemeToggle"></div>
        <div class="pill">
          ${getAvatarMarkup(user)}
          <span>${escapeHtml(user?.name || "Student User")}</span>
        </div>
      </div>
    `;
  }

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      showToast("Session cleared locally.", "info");
    } finally {
      clearSession();
      window.location.href = "/pages/login.html";
    }
  };

  document.getElementById("logoutButtonSidebar")?.addEventListener("click", handleLogout);
  mountThemeToggle(document.getElementById("topbarThemeToggle"));
};
