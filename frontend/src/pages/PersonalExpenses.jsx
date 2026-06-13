import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "../api/client";
import { AppLayout } from "../components/AppLayout";
import { TransactionDetailModal } from "../components/TransactionDetailModal";

import { formatCurrency, formatDate, capitalize } from "../utils/helpers";
import { useTheme } from "../context/ThemeContext";
import Chart from "chart.js/auto";
import { Plus, Edit, Trash2, Calendar, FolderOpen, RefreshCw } from "lucide-react";

export const PersonalExpenses = () => {
  const { theme } = useTheme();

  // Core Data States
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDetailExpense, setSelectedDetailExpense] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Input Filters
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [filterCategory, setFilterCategory] = useState("");
  const [analyticsYear, setAnalyticsYear] = useState(() => new Date().getFullYear().toString());

  // Input Form States (Add/Edit)
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  const getChartColors = () => {
    const isDark = theme === "dark";
    return {
      textColor: isDark ? "#d7e3f2" : "#314155",
      gridColor: isDark ? "rgba(154, 176, 200, 0.2)" : "rgba(97, 117, 137, 0.18)",
      tooltipBg: isDark ? "rgba(12, 23, 39, 0.96)" : "rgba(255, 255, 255, 0.96)",
      tooltipText: isDark ? "#f8fbff" : "#132238",
      primary: isDark ? "#38bdf8" : "#1f7aec",
      primaryFill: isDark ? "rgba(56, 189, 248, 0.16)" : "rgba(31, 122, 236, 0.08)"
    };
  };

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, historyRes, analyticsRes] = await Promise.all([
        apiClient.get(`/personal-expenses/summary?month=${filterMonth}`),
        apiClient.get(`/personal-expenses?month=${filterMonth}&category=${filterCategory}`),
        apiClient.get(`/personal-expenses/analytics?year=${analyticsYear}`)
      ]);

      setSummary(summaryRes);
      setHistory(historyRes.expenses);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load personal expenses ledger.");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsOnly = async () => {
    try {
      const analyticsRes = await apiClient.get(`/personal-expenses/analytics?year=${analyticsYear}`);
      setAnalytics(analyticsRes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [filterMonth, filterCategory]);

  useEffect(() => {
    loadAnalyticsOnly();
  }, [analyticsYear]);

  // Chart Rendering
  useEffect(() => {
    if (!analytics || !chartRef.current) return;

    const colors = getChartColors();

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels: analytics.monthlyTotals.map((item) => item.label),
        datasets: [
          {
            label: "Monthly Personal Spending (₹)",
            data: analytics.monthlyTotals.map((item) => item.totalAmount),
            borderColor: colors.primary,
            backgroundColor: colors.primaryFill,
            fill: true,
            tension: 0.32,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: colors.textColor,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.gridColor,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: colors.textColor },
            grid: { color: colors.gridColor }
          },
          y: {
            ticks: { color: colors.textColor },
            grid: { color: colors.gridColor }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [analytics, theme]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }

    try {
      setFormSubmitting(true);
      const methodLabel = paymentMethod === "upi" ? "UPI" : paymentMethod === "card" ? "Card" : "Cash";
      const payload = {
        title: title.trim(),
        amount: amt,
        category,
        date,
        note: note.trim() ? `${note.trim()} (Paid via ${methodLabel})` : `Paid via ${methodLabel}`
      };

      if (editingId) {
        await apiClient.put(`/personal-expenses/${editingId}`, payload);
      } else {
        await apiClient.post("/personal-expenses", payload);
      }

      handleResetForm();
      loadPageData();
    } catch (err) {
      setFormError(err.message || "Failed to save personal expense.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditClick = (expense) => {
    setEditingId(expense._id);
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(expense.date.split("T")[0]);

    let extractedMethod = "cash";
    let cleanedNote = expense.note || "";
    if (expense.note && expense.note.includes(" (Paid via ")) {
      const parts = expense.note.split(" (Paid via ");
      cleanedNote = parts[0];
      const method = parts[1].replace(")", "").toLowerCase();
      if (["cash", "upi", "card"].includes(method)) {
        extractedMethod = method;
      }
    } else if (expense.note && expense.note.startsWith("Paid via ")) {
      const method = expense.note.replace("Paid via ", "").toLowerCase();
      if (["cash", "upi", "card"].includes(method)) {
        extractedMethod = method;
        cleanedNote = "";
      }
    }
    setNote(cleanedNote);
    setPaymentMethod(extractedMethod);
    setFormError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleDeleteClick = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this personal expense? 🗑️");
    if (!confirmed) return;

    try {
      await apiClient.delete(`/personal-expenses/${id}`);
      if (editingId === id) {
        handleResetForm();
      }
      loadPageData();
    } catch (err) {
      alert(err.message || "Failed to delete expense.");
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setCategory("food");
    setDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setPaymentMethod("cash");
    setFormError("");
  };

  const renderStats = () => {
    if (!summary) return null;
    const topCategory = summary.categoryTotals[0];

    return (
      <div className="stats-grid">
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <span>Current Month Spent</span>
          <strong className="value">{formatCurrency(summary.currentMonthTotal)}</strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--secondary)" }}>
          <span>Selected Month Total</span>
          <strong className="value">{formatCurrency(summary.selectedMonthTotal)}</strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--accent)" }}>
          <span>Selected Month Entries</span>
          <strong className="value">{summary.selectedMonthCount}</strong>
        </article>
        <article className="card stat-card" style={{ borderLeft: "4px solid var(--success)" }}>
          <span>Top Category</span>
          <strong className="value">{topCategory ? capitalize(topCategory.category) : "None"}</strong>
        </article>
      </div>
    );
  };

  return (
    <AppLayout
      title="Personal Expenses"
      subtitle="Track your separate personal day-to-day spending logs completely detached from group accounts."
      actions={
        <button className="btn btn-secondary" onClick={loadPageData} title="Sync Dashboard">
          <RefreshCw size={16} /> Sync Logs
        </button>
      }
    >
      {loading && !summary ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <span className="eyebrow">Rummaging through your personal ledger... 📓</span>
        </div>
      ) : error ? (
        <div className="card stack-md" style={{ textAlign: "center", padding: "3rem" }}>
          <h3>Could not load personal expenses 💔</h3>
          <p className="muted-text">{error}</p>
          <button className="btn btn-secondary" onClick={loadPageData}>
            Try Reloading
          </button>
        </div>
      ) : (
        <div className="stack-lg">
          {renderStats()}

          <div className="content-grid two-column">
            {/* LEFT COLUMN: Input form and Filters */}
            <div className="stack-lg">
              <section className="card stack-md" style={{ position: "sticky", top: "1rem" }}>
                <h3 id="personalFormHeading" style={{ margin: 0 }}>
                  {editingId ? "Edit Personal Expense" : "Add Personal Expense"}
                </h3>
                <form onSubmit={handleFormSubmit} className="stack-md">
                  {formError && <div className="badge badge-danger btn-block">{formError}</div>}

                  {/* Title */}
                  <div>
                    <label htmlFor="pExpTitle">Title</label>
                    <input
                      id="pExpTitle"
                      type="text"
                      placeholder="e.g. Snack box, taxi back, laundry"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* Amount | Date */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "0.75rem" }}>
                    <div>
                      <label htmlFor="pExpAmount">Amount (₹)</label>
                      <input
                        id="pExpAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="pExpDate">Date</label>
                      <input
                        id="pExpDate"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Category | Payment Method */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label htmlFor="pExpCategory">Category</label>
                      <select id="pExpCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="food">Food</option>
                        <option value="transport">Transport</option>
                        <option value="shopping">Shopping</option>
                        <option value="bills">Bills</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="health">Health</option>
                        <option value="education">Education</option>
                        <option value="miscellaneous">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="pExpPaymentMethod">Payment Method</label>
                      <select id="pExpPaymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Debit/Credit Card</option>
                      </select>
                    </div>
                  </div>

                  {/* Private Note */}
                  <div>
                    <label htmlFor="pExpNote">Private Note</label>
                    <input
                      id="pExpNote"
                      type="text"
                      placeholder="e.g. Bought from local vendor"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <button type="submit" className="btn btn-primary btn-block" disabled={formSubmitting}>
                      {formSubmitting ? "Saving..." : editingId ? "Save Changes" : "Record Expense"}
                    </button>
                    {editingId && (
                      <button type="button" className="btn btn-ghost" onClick={handleResetForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </section>
            </div>

            {/* RIGHT COLUMN: Category breaking and History */}
            <div className="stack-lg">
              {/* Filters panel */}
              <section className="card stack-md">
                <h3 style={{ margin: 0 }}>Filter Ledger Logs 📂</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.5rem" }}>
                  <div>
                    <label htmlFor="monthFilter" style={{ fontSize: "0.85rem", marginBottom: "0.3rem" }}>Select Month</label>
                    <input
                      id="monthFilter"
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem" }}
                    />
                  </div>

                  <div>
                    <label htmlFor="categoryFilter" style={{ fontSize: "0.85rem", marginBottom: "0.3rem" }}>Select Category</label>
                    <select
                      id="categoryFilter"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", fontSize: "0.9rem" }}
                    >
                      <option value="">All Categories</option>
                      <option value="food">Food</option>
                      <option value="transport">Transport</option>
                      <option value="shopping">Shopping</option>
                      <option value="bills">Bills</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="health">Health</option>
                      <option value="education">Education</option>
                      <option value="miscellaneous">Other</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Category Breakdown */}
              <section className="card stack-md">
                <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
                  Category Distribution Breakdown 📊
                </h3>
                {summary && !summary.categoryTotals.length ? (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>
                    No distributions recorded this month! 📝
                  </div>
                ) : (
                  <div className="expense-list">
                    {summary?.categoryTotals.map((item, idx) => (
                      <article className="expense-item card" key={idx} style={{ padding: "0.6rem 0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ textTransform: "capitalize" }}>{item.category}</strong>
                          <div className="item-meta" style={{ fontSize: "0.8rem" }}>{item.totalCount} item(s)</div>
                        </div>
                        <strong>{formatCurrency(item.totalAmount)}</strong>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* History Ledger List */}
              <section className="card stack-md">
                <h3 style={{ margin: 0, borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
                  Personal History Ledger 📜
                </h3>
                {!history.length ? (
                  <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    Personal history ledger is blank this month! 📝
                  </div>
                ) : (
                  <div className="expense-list">
                    {history.map((expense) => (
                      <article
                        className="expense-item card"
                        key={expense._id}
                        style={{ padding: "1rem", display: "grid", gap: "0.4rem", cursor: "pointer" }}
                        onClick={() => {
                          setSelectedDetailExpense(expense);
                          setIsDetailOpen(true);
                        }}
                      >
                        <div className="item-head">
                          <div>
                            <strong style={{ fontSize: "1.1rem", color: "var(--text-strong)" }}>{expense.title}</strong>
                            <div className="item-meta" style={{ fontSize: "0.8rem", textTransform: "capitalize", marginTop: "0.1rem" }}>
                              {expense.category} • {formatDate(expense.date)}
                            </div>
                          </div>
                          <strong style={{ fontSize: "1.15rem", color: "var(--text-strong)" }}>{formatCurrency(expense.amount)}</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
                          {expense.note || "No private note added."}
                        </p>
                        <div className="item-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" }}>
                          <span className="item-meta" style={{ fontSize: "0.8rem" }}>Updated {formatDate(expense.updatedAt)}</span>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              className="btn btn-secondary"
                              style={{ minHeight: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem", borderRadius: "6px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(expense);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ minHeight: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem", borderRadius: "6px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(expense._id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Personal line chart analytics */}
          <section className="card stack-md">
            <div className="action-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-soft)", paddingBottom: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>Yearly Spent Analytics</h3>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <label htmlFor="analyticsYear" style={{ margin: 0, fontSize: "0.95rem" }}>Select Year:</label>
                <select
                  id="analyticsYear"
                  value={analyticsYear}
                  onChange={(e) => setAnalyticsYear(e.target.value)}
                  style={{ width: "auto", padding: "0.4rem 1.8rem 0.4rem 0.8rem", borderRadius: "10px" }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ position: "relative", height: "280px", width: "100%", marginTop: "1rem" }}>
              <canvas ref={chartRef} />
            </div>
          </section>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        expense={selectedDetailExpense}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />
    </AppLayout>
  );
};
export default PersonalExpenses;
