import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { AppLayout } from "../components/AppLayout";
import { formatCurrency, formatDate } from "../utils/helpers";
import { Plus } from "lucide-react";

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/dashboard/personal");
      setData(res);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const renderStats = () => {
    if (!data) return null;
    const { totalPaid, totalUserOwes, totalOthersOweUser, activeGroups } = data.stats;

    return (
      <div className="stats-grid">
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <span>Cash Flow Out 💸</span>
          <strong className="value">{formatCurrency(totalPaid)}</strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--danger)" }}>
          <span>Your Tab 📉</span>
          <strong className="value" style={{ color: totalUserOwes > 0 ? "var(--danger)" : "inherit" }}>
            {formatCurrency(totalUserOwes)}
          </strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <span>Due To You 📈</span>
          <strong className="value" style={{ color: totalOthersOweUser > 0 ? "var(--success)" : "inherit" }}>
            {formatCurrency(totalOthersOweUser)}
          </strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--secondary)" }}>
          <span>My Squads 🎒</span>
          <strong className="value">{activeGroups}</strong>
        </article>
      </div>
    );
  };

  const renderActiveGroups = () => {
    if (!data) return null;
    const { groups } = data;

    if (!groups.length) {
      return (
        <article className="card stack-md" style={{ textAlign: "center", padding: "2rem" }}>
          <h3>Squadless! 🎒</h3>
          <p className="muted-text">
            Create your first group to start splitting rent, food, cab fares, and weekend trips.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/groups")} style={{ marginTop: "1rem" }}>
            <Plus size={16} /> Create Group
          </button>
        </article>
      );
    }

    return (
      <div className="group-list">
        {groups.map((group) => (
          <article className="group-item" key={group._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ fontSize: "1.1rem" }}>{group.name}</strong>
              <div className="item-meta" style={{ marginTop: "0.2rem" }}>
                {group.type} • {group.memberCount} members
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate(`/groups/${group._id}`)}>
              Open
            </button>
          </article>
        ))}
      </div>
    );
  };

  const renderExpenses = () => {
    if (!data) return null;
    const { recentExpenses } = data;

    if (!recentExpenses.length) {
      return (
        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
          No recent expenses. Time to add some details! 🍜
        </div>
      );
    }

    return (
      <div className="expense-list">
        {recentExpenses.map((expense) => (
          <article className="expense-item" key={expense._id}>
            <div className="item-head">
              <div>
                <strong>{expense.title}</strong>
                <div className="item-meta">{expense.group.name} • {expense.categoryLabel}</div>
              </div>
              <strong>{formatCurrency(expense.amount)}</strong>
            </div>
            <div className="item-meta" style={{ marginTop: "0.4rem" }}>
              Paid by {expense.paidBy.name} on {formatDate(expense.date)}
            </div>
          </article>
        ))}
      </div>
    );
  };

  const renderSettlements = () => {
    if (!data) return null;
    const { recentSettlements } = data;

    if (!recentSettlements.length) {
      return (
        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
          No settlements yet. Keep balances clean! 🤝
        </div>
      );
    }

    return (
      <div className="settlement-list">
        {recentSettlements.map((settlement) => (
          <article className="settlement-item" key={settlement._id}>
            <div className="item-head">
              <div>
                <strong>{settlement.paidBy.name} paid {settlement.receivedBy.name}</strong>
                <div className="item-meta">{settlement.group.name}</div>
              </div>
              <strong>{formatCurrency(settlement.amount)}</strong>
            </div>
            <div className="item-meta" style={{ marginTop: "0.4rem" }}>
              {formatDate(settlement.date)} {settlement.note ? ` • ${settlement.note}` : ""}
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <AppLayout
      title="Personal Dashboard"
      subtitle="Track what you paid, what you owe, and the groups that matter right now."
      actions={
        <button className="btn btn-primary" onClick={() => navigate("/groups")}>
          Open Groups
        </button>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <span className="eyebrow">Rummaging through your hostel bills... 🎒</span>
        </div>
      ) : error ? (
        <div className="card stack-md" style={{ textAlign: "center", padding: "3rem" }}>
          <h3>Could not load dashboard 💔</h3>
          <p className="muted-text">{error}</p>
          <button className="btn btn-secondary" onClick={loadDashboard}>
            Try Reloading
          </button>
        </div>
      ) : (
        <div className="stack-lg">
          {renderStats()}

          <div className="content-grid two-column">
            <section className="card stack-md">
              <div className="section-header" style={{ marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>Active Squads 🎒</h3>
                <Link to="/groups" className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem", minHeight: "auto" }}>
                  Manage
                </Link>
              </div>
              {renderActiveGroups()}
            </section>

            <section className="card stack-md">
              <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
                Recent Settlements 🤝
              </h3>
              {renderSettlements()}
            </section>
          </div>

          <section className="card stack-md">
            <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
              Recent Expenses 📝
            </h3>
            {renderExpenses()}
          </section>
        </div>
      )}
    </AppLayout>
  );
};
export default Dashboard;
