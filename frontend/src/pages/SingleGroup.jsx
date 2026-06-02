import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/client";
import { AppLayout } from "../components/AppLayout";
import { Modal } from "../components/Modal";
import { AnalyticsPanel } from "../components/AnalyticsPanel";
import { formatCurrency, formatDate, formatDateTime } from "../utils/helpers";
import {
  ArrowLeft,
  Plus,
  ArrowLeftRight,
  BarChart3,
  UserPlus,
  Trash2,
  LogOut,
  Image,
  Eye,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export const SingleGroup = () => {
  const { groupId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Core Data State
  const [groupData, setGroupData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs: 'dashboard' | 'settlements' | 'analytics'
  const [activeTab, setActiveTab] = useState("dashboard");

  // Settlements History
  const [settlements, setSettlements] = useState([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);

  // Modal Open States
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);

  // Expense Form State
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expDesc, setExpDesc] = useState("");
  const [expCategory, setExpCategory] = useState("other");
  const [expCustomCategory, setExpCustomCategory] = useState("");
  const [expPaidBy, setExpPaidBy] = useState("");
  const [expSplitType, setExpSplitType] = useState("equal");
  const [expReceiptFile, setExpReceiptFile] = useState(null);
  const [expSplits, setExpSplits] = useState([]); // [{ userId, name, selected, value (custom amount/percentage) }]

  // Settlement Form State
  const [settlePayer, setSettlePayer] = useState("");
  const [settleReceiver, setSettleReceiver] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleDate, setSettleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [settleNote, setSettleNote] = useState("");

  // Member Form State
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  // Query / Filters State
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [sortOrder, setSortOrder] = useState("latest");

  // General Loading/Errors for operations
  const [opError, setOpError] = useState("");
  const [opSubmitting, setOpSubmitting] = useState(false);

  const fetchGroupDashboard = async () => {
    try {
      setLoading(true);
      const dashboard = await apiClient.get(`/groups/${groupId}/dashboard`);
      setGroupData(dashboard);
      setError("");

      // Pre-populate expense split members list
      if (dashboard?.group?.members) {
        const defaultSplits = dashboard.group.members.map((m) => ({
          userId: m.userId,
          name: m.name,
          selected: true,
          value: ""
        }));
        setExpSplits(defaultSplits);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load group details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (filterCategory) q.set("category", filterCategory);
      if (filterMember) q.set("member", filterMember);
      if (sortOrder) q.set("sort", sortOrder);

      const res = await apiClient.get(`/groups/${groupId}/expenses?${q.toString()}`);
      setExpenses(res.expenses);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettlements = async () => {
    try {
      setSettlementsLoading(true);
      const res = await apiClient.get(`/groups/${groupId}/settlements`);
      setSettlements(res.settlements);
    } catch (err) {
      console.error(err);
    } finally {
      setSettlementsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDashboard();
  }, [groupId]);

  useEffect(() => {
    if (groupData) {
      fetchExpenses();
    }
  }, [groupData, search, filterCategory, filterMember, sortOrder]);

  useEffect(() => {
    if (activeTab === "settlements") {
      fetchSettlements();
    }
  }, [activeTab]);

  const isAdmin = () => {
    if (!groupData || !currentUser) return false;
    const member = groupData.group.members.find((m) => m.userId === currentUser._id);
    return member?.role === "admin";
  };

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    try {
      setMemberSubmitting(true);
      await apiClient.post(`/groups/${groupId}/members`, { email: newMemberEmail.trim() });
      setNewMemberEmail("");
      fetchGroupDashboard();
    } catch (err) {
      alert(err.message || "Failed to add member.");
    } finally {
      setMemberSubmitting(false);
    }
  };

  // Kick Member
  const handleRemoveMember = async (userId, memberName) => {
    const confirmed = window.confirm(`Kick ${memberName} out of the group? Make sure they don't owe any money first! 🥾`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/groups/${groupId}/members/${userId}`);
      fetchGroupDashboard();
    } catch (err) {
      alert(err.message || "Failed to remove member.");
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    const confirmed = window.confirm("Are you sure you want to leave this group? Make sure you have settled all your balances first! 🚪");
    if (!confirmed) return;

    try {
      await apiClient.post(`/groups/${groupId}/leave`, {});
      navigate("/groups");
    } catch (err) {
      alert(err.message || "Failed to leave group.");
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    const confirmed = window.confirm("Are you sure you want to delete this expense? This action cannot be undone! 😉");
    if (!confirmed) return;

    try {
      await apiClient.delete(`/groups/${groupId}/expenses/${expenseId}`);
      fetchGroupDashboard();
    } catch (err) {
      alert(err.message || "Failed to delete expense.");
    }
  };

  // Add/Edit Expense Open Modal
  const openExpenseModal = (expense = null) => {
    setOpError("");
    if (expense) {
      // Edit mode
      setEditingExpenseId(expense._id);
      setExpTitle(expense.title);
      setExpAmount(expense.amount.toString());
      setExpDate(expense.date.split("T")[0]);
      setExpDesc(expense.description || "");
      setExpCategory(expense.category);
      setExpCustomCategory(expense.customCategory || "");
      setExpPaidBy(expense.paidBy._id);
      setExpSplitType(expense.splitType);
      setExpReceiptFile(null);

      // Re-map split members
      const activeSplits = groupData.group.members.map((m) => {
        const splitItem = expense.splitMembers.find((sm) => sm.user._id === m.userId);
        return {
          userId: m.userId,
          name: m.name,
          selected: !!splitItem,
          value: splitItem
            ? expense.splitType === "exact"
              ? splitItem.amount.toString()
              : expense.splitType === "percentage"
                ? splitItem.percentage.toString()
                : ""
            : ""
        };
      });
      setExpSplits(activeSplits);
    } else {
      // Add mode
      setEditingExpenseId(null);
      setExpTitle("");
      setExpAmount("");
      setExpDate(new Date().toISOString().split("T")[0]);
      setExpDesc("");
      setExpCategory("other");
      setExpCustomCategory("");
      setExpPaidBy(currentUser?._id || "");
      setExpSplitType("equal");
      setExpReceiptFile(null);

      const defaultSplits = groupData.group.members.map((m) => ({
        userId: m.userId,
        name: m.name,
        selected: true,
        value: ""
      }));
      setExpSplits(defaultSplits);
    }
    setExpenseModalOpen(true);
  };

  // Submit Expense Form
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setOpError("");

    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) {
      setOpError("Amount must be a positive number.");
      return;
    }

    const selectedSplits = expSplits.filter((s) => s.selected);
    if (!selectedSplits.length) {
      setOpError("At least one member must be selected to split.");
      return;
    }

    // Build splits payload array
    const splitMembers = expSplits.map((s) => {
      const isSelected = s.selected;
      let splitAmount = 0;
      let percentage = 0;

      if (isSelected) {
        if (expSplitType === "equal") {
          splitAmount = amt / selectedSplits.length;
        } else if (expSplitType === "exact") {
          splitAmount = parseFloat(s.value) || 0;
        } else if (expSplitType === "percentage") {
          percentage = parseFloat(s.value) || 0;
          splitAmount = (amt * percentage) / 100;
        }
      }

      return {
        user: s.userId,
        selected: isSelected,
        amount: splitAmount,
        percentage: percentage
      };
    });

    // Validate calculations
    if (expSplitType === "exact") {
      const sum = splitMembers.reduce((acc, curr) => acc + curr.amount, 0);
      if (Math.abs(sum - amt) > 0.05) {
        setOpError(`Exact split sum (${formatCurrency(sum)}) must equal total expense amount (${formatCurrency(amt)}).`);
        return;
      }
    } else if (expSplitType === "percentage") {
      const sumPct = splitMembers.reduce((acc, curr) => acc + curr.percentage, 0);
      if (Math.abs(sumPct - 100) > 0.05) {
        setOpError(`Percentage split sum (${sumPct}%) must equal 100%.`);
        return;
      }
    }

    try {
      setOpSubmitting(true);
      const formData = new FormData();
      formData.append("title", expTitle.trim());
      formData.append("amount", amt);
      formData.append("date", expDate);
      formData.append("description", expDesc.trim());
      formData.append("category", expCategory);
      if (expCategory === "custom") {
        formData.append("customCategory", expCustomCategory.trim());
      }
      formData.append("paidBy", expPaidBy);
      formData.append("splitType", expSplitType);
      formData.append("splitMembers", JSON.stringify(splitMembers));
      if (expReceiptFile) {
        formData.append("receipt", expReceiptFile);
      }

      if (editingExpenseId) {
        await apiClient.put(`/groups/${groupId}/expenses/${editingExpenseId}`, formData);
      } else {
        await apiClient.post(`/groups/${groupId}/expenses`, formData);
      }

      setExpenseModalOpen(false);
      fetchGroupDashboard();
    } catch (err) {
      setOpError(err.message || "Failed to submit expense details.");
    } finally {
      setOpSubmitting(false);
    }
  };

  // Submit Settlement
  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    setOpError("");

    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      setOpError("Amount must be a positive number.");
      return;
    }

    if (settlePayer === settleReceiver) {
      setOpError("Payer and receiver cannot be the same person.");
      return;
    }

    try {
      setOpSubmitting(true);
      await apiClient.post(`/groups/${groupId}/settlements`, {
        paidBy: settlePayer,
        receivedBy: settleReceiver,
        amount: amt,
        date: settleDate,
        note: settleNote.trim()
      });

      setSettleModalOpen(false);
      setSettleAmount("");
      setSettleNote("");
      fetchGroupDashboard();
      if (activeTab === "settlements") {
        fetchSettlements();
      }
    } catch (err) {
      setOpError(err.message || "Failed to log settlement.");
    } finally {
      setOpSubmitting(false);
    }
  };

  // Fast trigger settlement suggest click
  const triggerSuggestedSettlement = (fromId, toId, amount) => {
    setSettlePayer(fromId);
    setSettleReceiver(toId);
    setSettleAmount(amount.toString());
    setSettleDate(new Date().toISOString().split("T")[0]);
    setSettleNote("Balances settled");
    setSettleModalOpen(true);
  };

  const updateSplitVal = (userId, value) => {
    setExpSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, value } : s))
    );
  };

  const updateSplitSelect = (userId, selected) => {
    setExpSplits((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, selected } : s))
    );
  };

  // Render Dashboard sub-tab
  const renderDashboardTab = () => {
    if (!groupData) return null;

    return (
      <div className="content-grid two-column">
        {/* Left column: Members, Invite, Balances */}
        <div className="stack-lg">
          <section className="card stack-md">
            <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
              Squad Balances ⚖️
            </h3>
            <div className="member-list">
              {groupData.balances.map((member) => {
                const isPositive = member.netBalance > 0;
                const isNegative = member.netBalance < 0;
                const balClass = isPositive ? "positive-text" : isNegative ? "negative-text" : "neutral-text";

                return (
                  <article className="member-item" key={member.userId} style={{ display: "flex", justifyContent: "space-between", padding: "0.8rem 1rem" }}>
                    <div>
                      <strong>{member.name}</strong>
                      <div className="item-meta" style={{ fontSize: "0.85rem", marginTop: "0.1rem" }}>
                        Paid {formatCurrency(member.totalPaid)} • Owes {formatCurrency(member.totalOwed)}
                      </div>
                    </div>
                    <strong className={balClass}>{formatCurrency(member.netBalance)}</strong>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="card stack-md">
            <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
              Simplified Cash Settle Suggestions 🤝
            </h3>
            {!groupData.simplifiedDebts.length ? (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                Friendships are balanced! No pending balances. Outstanding! 🎉
              </div>
            ) : (
              <div className="settlement-list">
                {groupData.simplifiedDebts.map((item, idx) => (
                  <article className="suggestion-item card" key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1rem", border: "1px dashed var(--border)" }}>
                    <div>
                      <strong style={{ color: "var(--text-strong)" }}>{item.fromName}</strong> should pay <strong style={{ color: "var(--text-strong)" }}>{item.toName}</strong>
                      <div className="item-meta" style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--primary)", marginTop: "0.2rem" }}>
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ minHeight: "auto", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                      onClick={() => triggerSuggestedSettlement(item.from, item.to, item.amount)}
                    >
                      Settle
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="card stack-md">
            <div className="section-header" style={{ marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>Squad Members 🎒</h3>
              {isAdmin() && (
                <span className="eyebrow" style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}>Admin Tools</span>
              )}
            </div>
            {isAdmin() && (
              <form onSubmit={handleAddMember} className="inline-form" style={{ marginBottom: "0.5rem" }}>
                <input
                  type="email"
                  placeholder="Invite member by email..."
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  style={{ padding: "0.5rem 0.8rem", borderRadius: "10px" }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ minHeight: "auto", padding: "0.5rem 1rem" }} disabled={memberSubmitting}>
                  <UserPlus size={16} /> Invite
                </button>
              </form>
            )}
            <div className="member-list">
              {groupData.group.members.map((member) => (
                <article className="member-item card" key={member.userId} style={{ padding: "0.8rem 1rem" }}>
                  <div className="item-head">
                    <div>
                      <strong>{member.name}</strong>
                      <div className="item-meta" style={{ fontSize: "0.85rem" }}>{member.email}</div>
                    </div>
                    <span className="badge" style={{ padding: "0.15rem 0.5rem", fontSize: "0.75rem" }}>{member.role}</span>
                  </div>
                  <div className="item-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <span className="item-meta" style={{ fontSize: "0.8rem" }}>Joined {formatDate(member.joinedAt)}</span>
                    {isAdmin() && member.userId !== currentUser?._id && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: "0.3rem 0.6rem", minHeight: "auto", fontSize: "0.8rem", borderRadius: "8px" }}
                        onClick={() => handleRemoveMember(member.userId, member.name)}
                      >
                        Kick Out
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* Right column: Recent Activity and Filtered Expenses */}
        <div className="stack-lg">
          <section className="card stack-md">
            <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
              Dynamic Ledger Logs 📝
            </h3>

            {/* Filters panel */}
            <div className="card stack-md" style={{ background: "var(--surface-muted)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-soft)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Search bills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem" }}
                />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem" }}
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem" }}
                >
                  <option value="">All Categories</option>
                  <option value="food">Food</option>
                  <option value="rent">Rent</option>
                  <option value="cabs">Cabs</option>
                  <option value="groceries">Groceries</option>
                  <option value="gas">Gas</option>
                  <option value="snacks">Snacks</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                  style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem" }}
                >
                  <option value="">All Members</option>
                  {groupData.group.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expenses ledger list */}
            {!expenses.length ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                No expenses found in this ledger logs! 📝
              </div>
            ) : (
              <div className="expense-list">
                {expenses.map((expense) => {
                  const isCreator = expense.createdBy?._id === currentUser?._id;
                  const canManage = isCreator || isAdmin();

                  return (
                    <article className="expense-item card" key={expense._id} style={{ padding: "1rem", display: "grid", gap: "0.5rem" }}>
                      <div className="item-head">
                        <div>
                          <strong style={{ fontSize: "1.1rem", color: "var(--text-strong)" }}>{expense.title}</strong>
                          <div className="item-meta" style={{ fontSize: "0.85rem", marginTop: "0.1rem" }}>
                            <span className="badge" style={{ padding: "0.1rem 0.4rem", fontSize: "0.7rem", textTransform: "capitalize", background: "var(--secondary-soft)" }}>
                              {expense.categoryLabel}
                            </span>
                            <span style={{ marginLeft: "0.5rem" }}>Paid by {expense.paidBy.name}</span>
                          </div>
                        </div>
                        <strong style={{ fontSize: "1.15rem", color: "var(--text-strong)" }}>{formatCurrency(expense.amount)}</strong>
                      </div>

                      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                        {expense.description || "No description added."}
                      </p>

                      <div className="item-meta" style={{ fontSize: "0.8rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span>Date: <strong>{formatDate(expense.date)}</strong></span>
                        {expense.receiptImage && (
                          <a href={expense.receiptImage} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: "700" }}>
                            • View Receipt Image
                          </a>
                        )}
                      </div>

                      <div className="item-meta" style={{ fontSize: "0.8rem", borderTop: "1px solid var(--border-soft)", paddingTop: "0.4rem" }}>
                        <strong>Split members:</strong>{" "}
                        {expense.splitMembers.map((sm) => `${sm.user.name} (${formatCurrency(sm.amount)})`).join(", ")}
                      </div>

                      {canManage && (
                        <div className="item-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.3rem" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ minHeight: "auto", padding: "0.3rem 0.6rem", fontSize: "0.8rem", borderRadius: "8px" }}
                            onClick={() => openExpenseModal(expense)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ minHeight: "auto", padding: "0.3rem 0.6rem", fontSize: "0.8rem", borderRadius: "8px" }}
                            onClick={() => handleDeleteExpense(expense._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card stack-md">
            <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
              Squad Timeline Logs 🍃
            </h3>
            {!groupData.recentActivity.length ? (
              <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                Silence... no recent logs. 🍜
              </div>
            ) : (
              <div className="activity-list">
                {groupData.recentActivity.map((activity) => (
                  <article className="activity-item card" key={activity._id} style={{ padding: "0.8rem 1rem" }}>
                    <strong style={{ fontSize: "0.95rem" }}>{activity.message}</strong>
                    <div className="item-meta" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                      {formatDateTime(activity.createdAt)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  };

  // Render Settlements Tab
  const renderSettlementsTab = () => {
    return (
      <div className="stack-lg">
        <div className="card action-row" style={{ background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Settlements Registry Ledger</h3>
            <p className="muted-text" style={{ margin: "0.2rem 0 0 0", fontSize: "0.9rem" }}>Track payment entries made to clear cash balances between squad members.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setSettleModalOpen(true)}>
            <ArrowLeftRight size={16} /> Record a Payment
          </button>
        </div>

        {settlementsLoading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>Loading settlement logs...</div>
        ) : !settlements.length ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <h3>No payments recorded yet 🤝</h3>
            <p className="muted-text">Record the first payment once roommate balances are cleared!</p>
          </div>
        ) : (
          <div className="settlement-list">
            {settlements.map((settlement) => (
              <article className="settlement-item card" key={settlement._id} style={{ display: "flex", justifyContent: "space-between", padding: "1rem" }}>
                <div>
                  <div style={{ fontSize: "1.1rem" }}>
                    <strong style={{ color: "var(--text-strong)" }}>{settlement.paidBy.name}</strong> paid <strong style={{ color: "var(--text-strong)" }}>{settlement.receivedBy.name}</strong>
                  </div>
                  <div className="item-meta" style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
                    Date: <strong>{formatDate(settlement.date)}</strong>
                    {settlement.note && ` • Note: "${settlement.note}"`}
                  </div>
                </div>
                <strong style={{ fontSize: "1.2rem", color: "var(--success-strong)" }}>
                  +{formatCurrency(settlement.amount)}
                </strong>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout
      title={groupData ? groupData.group.name : "Group Details"}
      subtitle={groupData ? `Squad overview and ledger controls.` : "Loading..."}
      actions={
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => navigate("/groups")}>
            <ArrowLeft size={16} /> Back to Groups
          </button>
        </div>
      }
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <span className="eyebrow">Plotting squad ledgers... ⚖️</span>
        </div>
      ) : error ? (
        <div className="card stack-md" style={{ textAlign: "center", padding: "3rem" }}>
          <h3>Squad details unavailable 💔</h3>
          <p className="muted-text">{error}</p>
          <button className="btn btn-secondary" onClick={fetchGroupDashboard}>
            Try Reloading
          </button>
        </div>
      ) : (
        <div className="stack-lg">
          {/* Header hero section */}
          <div className="card group-hero" style={{ background: "var(--surface-emphasis)" }}>
            <div className="section-header" style={{ width: "100%" }}>
              <div>
                <span className="eyebrow" style={{ textTransform: "capitalize" }}>{groupData.group.type}</span>
                <h2 style={{ fontSize: "2.1rem", margin: "0.5rem 0 0.2rem 0", fontFamily: "Outfit, sans-serif" }}>
                  {groupData.group.name}
                </h2>
                <p className="muted-text" style={{ margin: 0 }}>
                  {groupData.group.description || "No description added yet."}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <span className="badge badge-warning" style={{ fontSize: "0.85rem", padding: "0.45rem 0.8rem" }}>
                  Invite Code: {groupData.group.inviteCode}
                </span>
                <button className="btn btn-danger" onClick={handleLeaveGroup} style={{ minHeight: "auto", padding: "0.45rem 1rem" }}>
                  <LogOut size={16} /> Leave Group
                </button>
              </div>
            </div>

            <div className="item-meta" style={{ display: "flex", gap: "1.5rem", borderTop: "1px solid var(--border-soft)", paddingTop: "0.8rem", width: "100%" }}>
              <span>Members: <strong>{groupData.group.memberCount}</strong></span>
              <span>Total spent: <strong>{formatCurrency(groupData.summary.totalExpenses)}</strong></span>
            </div>
          </div>

          {/* Sub-tabs Nav controls */}
          <div className="card" style={{ background: "var(--surface)", display: "flex", gap: "0.5rem", padding: "0.6rem", flexWrap: "wrap" }}>
            <button
              className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-ghost"}`}
              style={{ minHeight: "auto", padding: "0.5rem 1.2rem", borderRadius: "10px" }}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`btn ${activeTab === "settlements" ? "btn-primary" : "btn-ghost"}`}
              style={{ minHeight: "auto", padding: "0.5rem 1.2rem", borderRadius: "10px" }}
              onClick={() => setActiveTab("settlements")}
            >
              Settlement Logs
            </button>
            <button
              className={`btn ${activeTab === "analytics" ? "btn-primary" : "btn-ghost"}`}
              style={{ minHeight: "auto", padding: "0.5rem 1.2rem", borderRadius: "10px" }}
              onClick={() => setActiveTab("analytics")}
            >
              Analytics Graphs
            </button>

            {activeTab === "dashboard" && (
              <button
                className="btn btn-primary"
                style={{ marginLeft: "auto", minHeight: "auto", padding: "0.5rem 1.2rem", borderRadius: "10px" }}
                onClick={() => openExpenseModal()}
              >
                <Plus size={16} /> Add Expense
              </button>
            )}
          </div>

          {/* Rendering active tab branch */}
          {activeTab === "dashboard" && renderDashboardTab()}
          {activeTab === "settlements" && renderSettlementsTab()}
          {activeTab === "analytics" && (
            <AnalyticsPanel groupId={groupId} groupName={groupData.group.name} />
          )}
        </div>
      )}

      {/* EXPENSE ADD / EDIT MODAL */}
      <Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title={editingExpenseId ? "Edit Expense details" : "Add Group Expense"}>
        <form onSubmit={handleExpenseSubmit} className="stack-md">
          {opError && <div className="badge badge-danger btn-block">{opError}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.5rem" }}>
            <div>
              <label htmlFor="expTitle">Expense Name</label>
              <input
                id="expTitle"
                type="text"
                placeholder="e.g. Dinner party, Wi-Fi, electricity"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="expAmount">Amount (₹)</label>
              <input
                id="expAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr", gap: "0.5rem" }}>
            <div>
              <label htmlFor="expDate">Date</label>
              <input
                id="expDate"
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="expCategory">Category</label>
              <select id="expCategory" value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
                <option value="food">Food</option>
                <option value="rent">Rent</option>
                <option value="cabs">Cabs</option>
                <option value="groceries">Groceries</option>
                <option value="gas">Gas</option>
                <option value="snacks">Snacks</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
                <option value="custom">Custom...</option>
              </select>
            </div>
          </div>

          {expCategory === "custom" && (
            <div>
              <label htmlFor="expCustomCategory">Custom Category Name</label>
              <input
                id="expCustomCategory"
                type="text"
                placeholder="e.g. Gym fee, books"
                value={expCustomCategory}
                onChange={(e) => setExpCustomCategory(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="expDesc">Description / Note</label>
            <input
              id="expDesc"
              type="text"
              placeholder="e.g. Dominos double cheese margherita"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
            />
          </div>

          {groupData && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label htmlFor="expPaidBy">Paid By</label>
                <select id="expPaidBy" value={expPaidBy} onChange={(e) => setExpPaidBy(e.target.value)}>
                  {groupData.group.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="expSplitType">Split Style</label>
                <select id="expSplitType" value={expSplitType} onChange={(e) => setExpSplitType(e.target.value)}>
                  <option value="equal">Equal division</option>
                  <option value="exact">Exact amount</option>
                  <option value="percentage">Percentage share</option>
                </select>
              </div>
            </div>
          )}

          {/* Splits selection checklist */}
          <div style={{ border: "1px solid var(--border-soft)", borderRadius: "10px", padding: "0.8rem", background: "var(--surface-muted)", marginTop: "0.5rem" }}>
            <strong style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.95rem" }}>Split Shares Configuration:</strong>
            <div className="stack-md" style={{ maxHeight: "160px", overflowY: "auto", paddingRight: "0.2rem" }}>
              {expSplits.map((split) => (
                <div key={split.userId} style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, fontWeight: "normal", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={split.selected}
                      onChange={(e) => updateSplitSelect(split.userId, e.target.checked)}
                      style={{ width: "auto", margin: 0 }}
                    />
                    <span style={{ fontSize: "0.95rem" }}>{split.name}</span>
                  </label>

                  {split.selected && expSplitType !== "equal" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="number"
                        placeholder={expSplitType === "exact" ? "₹ 0.00" : "0%"}
                        value={split.value}
                        onChange={(e) => updateSplitVal(split.userId, e.target.value)}
                        style={{ width: "80px", padding: "0.2rem 0.4rem", borderRadius: "6px", fontSize: "0.85rem" }}
                        required
                      />
                      <span style={{ fontSize: "0.85rem" }}>{expSplitType === "exact" ? "₹" : "%"}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label>Receipt Image Upload (Optional)</label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setExpReceiptFile(e.target.files[0])}
                style={{ display: "none" }}
                id="receiptImgInput"
              />
              <label
                htmlFor="receiptImgInput"
                className="btn btn-ghost"
                style={{ cursor: "pointer", display: "inline-flex", gap: "0.5rem", minHeight: "auto", padding: "0.6rem 1rem", marginBottom: 0 }}
              >
                <Image size={16} /> Choose Image
              </label>
              <span className="muted-text" style={{ fontSize: "0.85rem" }}>
                {expReceiptFile ? expReceiptFile.name : "No file chosen"}
              </span>
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={opSubmitting} style={{ marginTop: "1rem" }}>
            {opSubmitting ? "Submitting Ledger Details..." : editingExpenseId ? "Save Changes" : "Record Expense"}
          </button>
        </form>
      </Modal>

      {/* RECORD SETTLEMENT MODAL */}
      <Modal isOpen={settleModalOpen} onClose={() => setSettleModalOpen(false)} title="Record Payment Settlement">
        <form onSubmit={handleSettleSubmit} className="stack-md">
          {opError && <div className="badge badge-danger btn-block">{opError}</div>}
          <p className="muted-text" style={{ fontSize: "0.9rem", margin: "0 0 0.5rem 0" }}>
            Record payments made directly between roommate bank accounts or in cash to balance net debts!
          </p>

          {groupData && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label htmlFor="settlePayer">Payer (Who Paid)</label>
                <select id="settlePayer" value={settlePayer} onChange={(e) => setSettlePayer(e.target.value)} required>
                  <option value="">Select Payer...</option>
                  {groupData.group.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="settleReceiver">Receiver (Who Received)</label>
                <select id="settleReceiver" value={settleReceiver} onChange={(e) => setSettleReceiver(e.target.value)} required>
                  <option value="">Select Receiver...</option>
                  {groupData.group.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.3fr", gap: "0.5rem" }}>
            <div>
              <label htmlFor="settleAmount">Amount Paid (₹)</label>
              <input
                id="settleAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="settleDate">Payment Date</label>
              <input
                id="settleDate"
                type="date"
                value={settleDate}
                onChange={(e) => setSettleDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="settleNote">Optional Note</label>
            <input
              id="settleNote"
              type="text"
              placeholder="e.g. Paid via UPI, Cash returned"
              value={settleNote}
              onChange={(e) => setSettleNote(e.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={opSubmitting} style={{ marginTop: "1rem" }}>
            {opSubmitting ? "Logging Settlement..." : "Log Settlement"}
          </button>
        </form>
      </Modal>
    </AppLayout>
  );
};
export default SingleGroup;
