import React from "react";
import { Sidebar } from "./Sidebar";

export const AppLayout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-body" style={{ minWidth: 0, display: "flex", flexDirection: "column", flex: 1 }}>
        <header className="top-navigation-bar">
          <div className="topbar-left">
            <span className="topbar-title">{title}</span>
          </div>
          {actions && <div className="topbar-actions-panel">{actions}</div>}
        </header>
        
        <div className="page-content">
          {subtitle && (
            <div className="page-header-desc">
              <p>{subtitle}</p>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};
export default AppLayout;
