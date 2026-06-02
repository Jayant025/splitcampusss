import { clearSession, getToken } from "../utils/auth.js";

const createRequestOptions = (method, body, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  const isFormData = body instanceof FormData;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!isFormData && body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? body
          : headers.get("Content-Type") === "application/json"
            ? JSON.stringify(body)
            : body
  };
};

const request = async (url, method = "GET", body, options = {}) => {
  const response = await fetch(`/api${url}`, createRequestOptions(method, body, options));
  let payload = {};

  try {
    payload = await response.json();
  } catch (error) {
    payload = {
      success: false,
      message: "Unexpected server response."
    };
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      if (!window.location.pathname.includes("/pages/login.html")) {
        window.location.href = "/pages/login.html";
      }
    }

    throw new Error(payload.message || "Request failed.");
  }

  return payload.data;
};

export const apiClient = {
  get: (url) => request(url, "GET"),
  post: (url, body, options) => request(url, "POST", body, options),
  put: (url, body, options) => request(url, "PUT", body, options),
  delete: (url) => request(url, "DELETE")
};

