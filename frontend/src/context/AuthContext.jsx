import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient, getToken, setToken, removeToken } from "../api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await apiClient.get("/auth/me");
      setUser(userData.user);
    } catch (error) {
      console.error("Failed to load user session:", error);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const signup = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await apiClient.post("/auth/signup", { name, email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiClient.post("/auth/login", { email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      removeToken();
      setUser(null);
    }
  };

  const updateProfile = async (formData) => {
    try {
      const data = await apiClient.put("/users/profile", formData);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await apiClient.put("/users/password", { currentPassword, newPassword });
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signup,
        login,
        logout,
        updateProfile,
        updatePassword,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
const hello = 20;
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
