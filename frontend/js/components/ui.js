import { escapeHtml } from "../utils/helpers.js";

export const setButtonLoading = (button, isLoading, loadingText = "Please wait...") => {
  if (!button) {
    return;
  }

  if (isLoading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = loadingText;
    return;
  }

  button.disabled = false;
  button.innerHTML = button.dataset.originalText || button.innerHTML;
};

export const renderState = (container, title, description) => {
  container.innerHTML = `
    <div class="state-card">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(description)}</p>
    </div>
  `;
};

export const ensureToastRoot = () => {
  let root = document.getElementById("toastRoot");

  if (!root) {
    root = document.createElement("div");
    root.id = "toastRoot";
    root.className = "toast-root";
    document.body.appendChild(root);
  }

  return root;
};

export const showToast = (message, type = "success") => {
  const root = ensureToastRoot();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
};

