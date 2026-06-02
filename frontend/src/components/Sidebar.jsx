import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  Users,
  Wallet,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/groups", label: "Groups", icon: Users },
    { to: "/personal-expenses", label: "Personal Expenses", icon: Wallet },
    { to: "/profile", label: "Profile", icon: User }
  ];

  const renderNavLinks = () =>
    navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        <item.icon className="sidebar-link-icon" size={20} />
        <span>{item.label}</span>
      </NavLink>
    ));

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="mobile-header-bar">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
          SplitCampus
        </a>
        <button
          className="btn btn-ghost mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-panel">
          <div className="sidebar-header">
            <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
              SplitCampus
            </a>
            <button
              className="btn btn-ghost sidebar-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close Navigation Menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="sidebar-nav">{renderNavLinks()}</nav>

          <div className="sidebar-footer">
            {/* Quick User Card */}
            {user && (
              <div className="sidebar-user-card" onClick={() => navigate("/profile")}>
                <div className="sidebar-user-avatar">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="sidebar-user-info">
                  <span className="name">{user.name}</span>
                  <span className="email">{user.email}</span>
                </div>
              </div>
            )}

            {/* Actions Panel */}
            <div className="sidebar-footer-actions">
              <button
                type="button"
                className="btn btn-ghost theme-toggle-btn"
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>

              <button
                type="button"
                className="btn btn-danger btn-logout"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
    </>
  );
};
