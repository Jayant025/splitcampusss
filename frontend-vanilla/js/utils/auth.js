const STORAGE_KEY = "splitcampus_session";

export const saveSession = ({ token, user }) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token,
      user
    })
  );
};

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (error) {
    return null;
  }
};

export const getToken = () => getSession()?.token || "";

export const getStoredUser = () => getSession()?.user || null;

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isAuthenticated = () => Boolean(getToken());

export const updateStoredUser = (user) => {
  const session = getSession();

  if (!session) {
    return;
  }

  saveSession({
    token: session.token,
    user
  });
};

