import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { AppLayout } from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/Modal";
import { formatCurrency, formatDate } from "../utils/helpers";
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Landmark, 
  Users, 
  ChevronRight, 
  FileText, 
  CheckCircle,
  FolderPlus
} from "lucide-react";

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddExpenseSelector, setShowAddExpenseSelector] = useState(false);
  
  const { user } = useAuth();
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

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleAddNewExpense = () => {
    if (!data?.groups || !data.groups.length) {
      alert("You need to create or join a squad first!");
      return;
    }
    if (data.groups.length === 1) {
      navigate(`/groups/${data.groups[0]._id}?add=true`);
    } else {
      setShowAddExpenseSelector(true);
    }
  };

  const renderWelcomeSection = () => {
    if (!data) return null;
    const firstName = user?.name ? user.name.split(" ")[0] : "Jayant";
    const activeGroups = data.stats.activeGroups;
    const totalUserOwes = data.stats.totalUserOwes;

    return (
      <section className="dashboard-welcome-banner">
        <div className="welcome-info">
          <h2>{getGreeting()}, {firstName} 👋</h2>
          <p>
            You have {activeGroups} active {activeGroups === 1 ? "squad" : "squads"} and{" "}
            {totalUserOwes > 0 
              ? `pending settlements totaling ${formatCurrency(totalUserOwes)}.` 
              : "no pending settlements."}
          </p>
        </div>
        <div className="welcome-actions">
          <button className="btn btn-primary" onClick={handleAddNewExpense}>
            <Plus size={16} /> Add Expense
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/groups?create=true")}>
            <FolderPlus size={16} /> Create Squad
          </button>
        </div>
      </section>
    );
  };

  const renderStats = () => {
    if (!data) return null;
    const { totalPaid, totalUserOwes, totalOthersOweUser, activeGroups } = data.stats;

    return (
      <div className="stats-grid">
        <article className="card stat-card">
          <div className="stat-header">
            <span className="stat-title">Cash Flow Out</span>
            <ArrowUpRight size={18} style={{ color: "var(--text-muted)" }} />
          </div>
          <strong className="value">{formatCurrency(totalPaid)}</strong>
          <span className="stat-desc">Total paid by you across all groups</span>
          <span className="stat-meta">Active billing this month</span>
        </article>
        
        <article className="card stat-card">
          <div className="stat-header">
            <span className="stat-title">Your Tab</span>
            <ArrowDownLeft size={18} style={{ color: totalUserOwes > 0 ? "var(--danger)" : "var(--text-muted)" }} />
          </div>
          <strong className="value" style={{ color: totalUserOwes > 0 ? "var(--danger)" : "inherit" }}>
            {formatCurrency(totalUserOwes)}
          </strong>
          <span className="stat-desc">Amount you owe to other members</span>
          <span className="stat-meta">{totalUserOwes > 0 ? "Requires settlement" : "No outstanding debts"}</span>
        </article>

        <article className="card stat-card">
          <div className="stat-header">
            <span className="stat-title">Due To You</span>
            <Landmark size={18} style={{ color: totalOthersOweUser > 0 ? "var(--success)" : "var(--text-muted)" }} />
          </div>
          <strong className="value" style={{ color: totalOthersOweUser > 0 ? "var(--success)" : "inherit" }}>
            {formatCurrency(totalOthersOweUser)}
          </strong>
          <span className="stat-desc">Amount other members owe you</span>
          <span className="stat-meta">{totalOthersOweUser > 0 ? "Pending collection" : "All balances settled"}</span>
        </article>

        <article className="card stat-card">
          <div className="stat-header">
            <span className="stat-title">My Squads</span>
            <Users size={18} style={{ color: "var(--text-muted)" }} />
          </div>
          <strong className="value">{activeGroups}</strong>
          <span className="stat-desc">Active sharing groups</span>
          <span className="stat-meta">Hostels, flats, and trips</span>
        </article>
      </div>
    );
  };

  const renderActiveGroups = () => {
    if (!data) return null;
    const { groups } = data;

    if (!groups.length) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={20} />
          </div>
          <h3>No active squads yet</h3>
          <p>Create your first sharing group or join an existing one to begin tracking and splitting bills.</p>
          <div className="empty-state-actions">
            <button className="btn btn-primary" onClick={() => navigate("/groups?create=true")}>
              <Plus size={16} /> Create Squad
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/groups")}>
              Join Squad
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="group-list" style={{ display: "grid", gap: "0.75rem" }}>
        {groups.map((group) => (
          <article 
            className="group-item card" 
            key={group._id} 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "1rem 1.25rem",
              cursor: "pointer"
            }}
            onClick={() => navigate(`/groups/${group._id}`)}
          >
            <div>
              <strong style={{ fontSize: "0.95rem", color: "var(--text-strong)" }}>{group.name}</strong>
              <div className="item-meta" style={{ marginTop: "0.2rem", fontSize: "0.82rem" }}>
                <span style={{ textTransform: "capitalize" }}>{group.type}</span>
                <span style={{ margin: "0 0.4rem" }}>•</span>
                <span>{group.memberCount} members</span>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
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
        <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
          <div className="empty-state-icon">
            <FileText size={18} />
          </div>
          <h3>📋 No expenses yet</h3>
          <p>Start tracking your spending to unlock insights, ledger logs, and analytics.</p>
          <button className="btn btn-secondary" style={{ minHeight: "auto", padding: "0.5rem 1rem" }} onClick={handleAddNewExpense}>
            Add First Expense
          </button>
        </div>
      );
    }

    return (
      <div className="expense-list" style={{ display: "grid", gap: "0.75rem" }}>
        {recentExpenses.map((expense) => (
          <article 
            className="expense-item card" 
            key={expense._id}
            style={{ padding: "1rem 1.25rem", cursor: "pointer" }}
            onClick={() => navigate(`/groups/${expense.group._id}`)}
          >
            <div className="item-head">
              <div>
                <strong style={{ color: "var(--text-strong)", fontSize: "0.95rem" }}>{expense.title}</strong>
                <div className="item-meta" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>
                  {expense.group.name} • {expense.categoryLabel}
                </div>
              </div>
              <strong style={{ color: "var(--text-strong)", fontSize: "1.05rem" }}>
                {formatCurrency(expense.amount)}
              </strong>
            </div>
            <div className="item-meta" style={{ marginTop: "0.5rem", fontSize: "0.8rem", borderTop: "1px solid var(--border-soft)", paddingTop: "0.5rem" }}>
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
        <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
          <div className="empty-state-icon">
            <CheckCircle size={18} />
          </div>
          <h3>All balances are balanced</h3>
          <p>No recent settlements recorded. Squad payments are fully squared up!</p>
        </div>
      );
    }

    return (
      <div className="settlement-list" style={{ display: "grid", gap: "0.75rem" }}>
        {recentSettlements.map((settlement) => (
          <article 
            className="settlement-item card" 
            key={settlement._id}
            style={{ padding: "1rem 1.25rem", cursor: "pointer" }}
            onClick={() => navigate(`/groups/${settlement.group._id}`)}
          >
            <div className="item-head">
              <div>
                <strong style={{ color: "var(--text-strong)", fontSize: "0.95rem" }}>
                  {settlement.paidBy.name} paid {settlement.receivedBy.name}
                </strong>
                <div className="item-meta" style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}>
                  {settlement.group.name}
                </div>
              </div>
              <strong style={{ color: "var(--success)", fontSize: "1.05rem" }}>
                {formatCurrency(settlement.amount)}
              </strong>
            </div>
            <div className="item-meta" style={{ marginTop: "0.5rem", fontSize: "0.8rem", borderTop: "1px solid var(--border-soft)", paddingTop: "0.5rem" }}>
              {formatDate(settlement.date)} {settlement.note ? ` • "${settlement.note}"` : ""}
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
          {renderWelcomeSection()}
          {renderStats()}

          <div className="content-grid two-column">
            <section className="card stack-md">
              <div className="section-header" style={{ marginBottom: "0.5rem" }}>
                <h3 style={{ margin: 0 }}>Active Squads</h3>
                <Link to="/groups" className="btn btn-ghost" style={{ padding: "0.4rem 0.8rem", minHeight: "auto", fontSize: "0.85rem" }}>
                  Manage
                </Link>
              </div>
              {renderActiveGroups()}
            </section>

            <section className="card stack-md">
              <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
                Recent Settlements
              </h3>
              {renderSettlements()}
            </section>
          </div>

          <section className="card stack-md">
            <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
              Recent Expenses
            </h3>
            {renderExpenses()}
          </section>
        </div>
      )}

      {/* Select Squad Modal for Add Expense */}
      <Modal 
        isOpen={showAddExpenseSelector} 
        onClose={() => setShowAddExpenseSelector(false)} 
        title="Select Squad to Add Expense"
      >
        <p className="muted-text" style={{ fontSize: "0.9rem", margin: "0 0 1.25rem 0" }}>
          Expenses must belong to a squad. Select which squad ledger to add this bill to:
        </p>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {data?.groups.map((group) => (
            <button
              key={group._id}
              className="btn btn-ghost btn-block"
              style={{ justifyContent: "space-between", textAlign: "left", padding: "0.75rem 1.25rem", borderRadius: "10px" }}
              onClick={() => {
                setShowAddExpenseSelector(false);
                navigate(`/groups/${group._id}?add=true`);
              }}
            >
              <span>{group.name}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </Modal>
    </AppLayout>
  );
};

export default Dashboard;
