import React from "react";
import { Sidebar } from "./Sidebar";

export const AppLayout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-body stack-lg" style={{ minWidth: 0 }}>
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </div>
        <div className="page-content" style={{ animation: "modalSlideUp 0.4s ease" }}>
          {children}
        </div>
      </main>
    </div>
  );
};
export default AppLayout;
