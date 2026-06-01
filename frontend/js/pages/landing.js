import { isAuthenticated } from "../utils/auth.js";

import { mountThemeToggle } from "../utils/theme.js";

const heroPrimaryAction = document.getElementById("heroPrimaryAction");

if (heroPrimaryAction && isAuthenticated()) {
  heroPrimaryAction.textContent = "Open your dashboard";
  heroPrimaryAction.href = "/pages/dashboard.html";
}

mountThemeToggle();
