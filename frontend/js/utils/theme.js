const THEME_STORAGE_KEY = "splitcampus_theme";
const THEME_EVENT_NAME = "splitcampus:theme-change";

const normalizeTheme = (theme) => (theme === "dark" ? "dark" : "light");

export const getCurrentTheme = () => {
  const activeTheme = document.documentElement.dataset.theme;

  if (activeTheme === "dark" || activeTheme === "light") {
    return activeTheme;
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return normalizeTheme(savedTheme);
};

export const applyTheme = (theme, options = {}) => {
  const normalizedTheme = normalizeTheme(theme);
  const { persist = true, silent = false } = options;

  document.documentElement.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;

  if (persist) {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  }

  if (!silent) {
    window.dispatchEvent(
      new CustomEvent(THEME_EVENT_NAME, {
        detail: {
          theme: normalizedTheme
        }
      })
    );
  }
};

export const toggleTheme = () => {
  applyTheme(getCurrentTheme() === "dark" ? "light" : "dark");
};

const getTogglePresentation = () => {
  const currentTheme = getCurrentTheme();
  const targetTheme = currentTheme === "dark" ? "light" : "dark";
  const icon = targetTheme === "dark" ? "\u263e" : "\u2600";

  return {
    currentTheme,
    targetTheme,
    label: targetTheme === "dark" ? "Dark Mode" : "Light Mode",
    icon
  };
};

const updateToggleButton = (button) => {
  const toggleMeta = getTogglePresentation();
  const iconNode = button.querySelector(".theme-toggle-icon");
  const labelNode = button.querySelector(".theme-toggle-label");

  if (iconNode) {
    iconNode.textContent = toggleMeta.icon;
  }

  if (labelNode) {
    labelNode.textContent = toggleMeta.label;
  }

  button.dataset.theme = toggleMeta.currentTheme;
  button.setAttribute("aria-label", `Switch to ${toggleMeta.label.toLowerCase()}`);
  button.setAttribute("title", `Switch to ${toggleMeta.label.toLowerCase()}`);
};

const getFloatingThemeHost = () => {
  let host = document.getElementById("floatingThemeToggleRoot");

  if (!host) {
    host = document.createElement("div");
    host.id = "floatingThemeToggleRoot";
    host.className = "theme-toggle-floating";
    document.body.appendChild(host);
  }

  return host;
};

export const mountThemeToggle = (container = null) => {
  const host = container || getFloatingThemeHost();

  host.innerHTML = `
    <button class="btn btn-ghost theme-toggle-button" type="button">
      <span class="theme-toggle-icon" aria-hidden="true"></span>
      <span class="theme-toggle-label"></span>
    </button>
  `;

  const button = host.querySelector(".theme-toggle-button");

  updateToggleButton(button);
  button.addEventListener("click", toggleTheme);
  window.addEventListener(THEME_EVENT_NAME, () => updateToggleButton(button));

  return button;
};

export const onThemeChange = (callback) => {
  const handler = (event) => {
    callback(event.detail.theme);
  };

  window.addEventListener(THEME_EVENT_NAME, handler);

  return () => {
    window.removeEventListener(THEME_EVENT_NAME, handler);
  };
};

export const getChartTheme = () => {
  const styles = window.getComputedStyle(document.documentElement);
  const getValue = (propertyName) => styles.getPropertyValue(propertyName).trim();

  return {
    textColor: getValue("--chart-text"),
    gridColor: getValue("--chart-grid"),
    tooltipBackground: getValue("--chart-tooltip-bg"),
    tooltipText: getValue("--chart-tooltip-text"),
    primary: getValue("--chart-primary"),
    primaryFill: getValue("--chart-primary-fill"),
    secondary: getValue("--chart-secondary"),
    palette: [
      getValue("--chart-palette-1"),
      getValue("--chart-palette-2"),
      getValue("--chart-palette-3"),
      getValue("--chart-palette-4"),
      getValue("--chart-palette-5"),
      getValue("--chart-palette-6"),
      getValue("--chart-palette-7")
    ]
  };
};

