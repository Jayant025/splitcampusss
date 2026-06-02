import {
  createPersonalExpense,
  deletePersonalExpense,
  getPersonalExpenseAnalytics,
  getPersonalExpenseSummary,
  getPersonalExpenses,
  updatePersonalExpense
} from "../api/personalExpenseApi.js";
import { renderAppLayout } from "../components/layout.js";
import { renderState, setButtonLoading, showToast } from "../components/ui.js";
import { capitalize, escapeHtml, formatCurrency, formatDate } from "../utils/helpers.js";
import { requireAuth } from "../utils/guards.js";
import { getChartTheme, onThemeChange } from "../utils/theme.js";

if (requireAuth()) {
  renderAppLayout({
    title: "Personal Monthly Expenses",
    subtitle: "Use this separate money-manager module to track your own day-to-day expenses.",
    activeNav: "personal-expenses"
  });

  const statsContainer = document.getElementById("personalExpenseStats");
  const form = document.getElementById("personalExpenseForm");
  const formHeading = document.getElementById("personalExpenseFormHeading");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const categoryTotals = document.getElementById("categoryTotals");
  const filtersForm = document.getElementById("personalExpenseFilters");
  const monthFilter = document.getElementById("monthFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const historyContainer = document.getElementById("personalExpenseHistory");
  const yearSelect = document.getElementById("personalExpenseYear");

  let editingExpenseId = "";
  let personalExpenseChart = null;
  let currentHistory = [];
  let latestAnalyticsData = null;

  const getCurrentMonthValue = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const getCurrentDateValue = () => new Date().toISOString().split("T")[0];

  const resetForm = () => {
    form.reset();
    form.date.value = getCurrentDateValue();
    editingExpenseId = "";
    formHeading.textContent = "Add personal expense";
    cancelEditButton.classList.add("hidden");
  };

  const fillFormForEdit = (expense) => {
    editingExpenseId = expense._id;
    formHeading.textContent = "Edit personal expense";
    cancelEditButton.classList.remove("hidden");
    form.title.value = expense.title;
    form.amount.value = expense.amount;
    form.category.value = expense.category;
    form.date.value = new Date(expense.date).toISOString().split("T")[0];
    form.note.value = expense.note || "";
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const renderStats = (summary) => {
    const topCategory = summary.categoryTotals[0];

    statsContainer.innerHTML = `
      <article class="card stat-card">
        <span>Current month total</span>
        <strong class="value">${formatCurrency(summary.currentMonthTotal)}</strong>
      </article>
      <article class="card stat-card">
        <span>Selected month total</span>
        <strong class="value">${formatCurrency(summary.selectedMonthTotal)}</strong>
      </article>
      <article class="card stat-card">
        <span>Selected month entries</span>
        <strong class="value">${summary.selectedMonthCount}</strong>
      </article>
      <article class="card stat-card">
        <span>Top category</span>
        <strong class="value">${escapeHtml(
          topCategory ? capitalize(topCategory.category) : "None"
        )}</strong>
      </article>
    `;
  };

  const renderCategoryTotals = (summary) => {
    if (!summary.categoryTotals.length) {
      renderState(
        categoryTotals,
        "No category totals yet",
        "Add expenses in the selected month to see a category-wise breakdown."
      );
      return;
    }

    categoryTotals.innerHTML = `
      <div class="expense-list">
        ${summary.categoryTotals
          .map(
            (item) => `
              <article class="expense-item">
                <div class="item-head">
                  <strong>${escapeHtml(capitalize(item.category))}</strong>
                  <strong>${formatCurrency(item.totalAmount)}</strong>
                </div>
                <div class="item-meta">${item.totalCount} expense(s)</div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const renderHistory = (expenses) => {
    currentHistory = expenses;

    if (!expenses.length) {
      renderState(
        historyContainer,
        "No personal expenses found",
        "Try changing the filters or add your first personal expense."
      );
      return;
    }

    historyContainer.innerHTML = `
      <div class="expense-list">
        ${expenses
          .map(
            (expense) => `
              <article class="expense-item">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(expense.title)}</strong>
                    <div class="item-meta">${escapeHtml(capitalize(expense.category))} &middot; ${formatDate(
              expense.date
            )}</div>
                  </div>
                  <strong>${formatCurrency(expense.amount)}</strong>
                </div>
                <p>${escapeHtml(expense.note || "No note added.")}</p>
                <div class="item-actions">
                  <span class="item-meta">Updated ${formatDate(expense.updatedAt)}</span>
                  <div class="item-actions">
                    <button class="btn btn-secondary personal-edit-button" data-expense-id="${expense._id}" type="button">Edit</button>
                    <button class="btn btn-danger personal-delete-button" data-expense-id="${expense._id}" type="button">Delete</button>
                  </div>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;

    historyContainer.querySelectorAll(".personal-edit-button").forEach((button) => {
      button.addEventListener("click", () => {
        const expense = currentHistory.find((item) => item._id === button.dataset.expenseId);

        if (expense) {
          fillFormForEdit(expense);
        }
      });
    });

    historyContainer.querySelectorAll(".personal-delete-button").forEach((button) => {
      button.addEventListener("click", async () => {
        const confirmed = window.confirm("Delete this personal expense?");

        if (!confirmed) {
          return;
        }

        try {
          await deletePersonalExpense(button.dataset.expenseId);
          showToast("Personal expense deleted successfully.");
          if (editingExpenseId === button.dataset.expenseId) {
            resetForm();
          }
          await loadPageData();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  };

  const renderAnalytics = (analytics) => {
    const context = document.getElementById("personalExpenseChart");
    const chartTheme = getChartTheme();

    if (personalExpenseChart) {
      personalExpenseChart.destroy();
    }

    personalExpenseChart = new window.Chart(context, {
      type: "line",
      data: {
        labels: analytics.monthlyTotals.map((item) => item.label),
        datasets: [
          {
            label: "Monthly personal spending",
            data: analytics.monthlyTotals.map((item) => item.totalAmount),
            borderColor: chartTheme.primary,
            backgroundColor: chartTheme.primaryFill,
            fill: true,
            tension: 0.32
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: chartTheme.textColor,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: chartTheme.tooltipBackground,
            titleColor: chartTheme.tooltipText,
            bodyColor: chartTheme.tooltipText,
            borderColor: chartTheme.gridColor,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: {
              color: chartTheme.textColor
            },
            grid: {
              color: chartTheme.gridColor
            },
            border: {
              color: chartTheme.gridColor
            }
          },
          y: {
            ticks: {
              color: chartTheme.textColor
            },
            grid: {
              color: chartTheme.gridColor
            },
            border: {
              color: chartTheme.gridColor
            }
          }
        }
      }
    });
  };

  const loadSummary = async () => {
    const month = monthFilter.value || getCurrentMonthValue();
    const summary = await getPersonalExpenseSummary(month);
    renderStats(summary);
    renderCategoryTotals(summary);
  };

  const loadHistory = async () => {
    const data = await getPersonalExpenses({
      month: monthFilter.value,
      category: categoryFilter.value
    });
    renderHistory(data.expenses);
  };

  const loadAnalytics = async () => {
    const analytics = await getPersonalExpenseAnalytics(yearSelect.value);
    latestAnalyticsData = analytics;
    renderAnalytics(analytics);
  };

  const loadPageData = async () => {
    try {
      await Promise.all([loadSummary(), loadHistory(), loadAnalytics()]);
    } catch (error) {
      showToast(error.message, "error");
      renderState(
        historyContainer,
        "Personal expenses unavailable",
        "Could not load your personal expense data right now."
      );
    }
  };

  const buildYearOptions = () => {
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = Array.from({ length: 5 }, (_, index) => currentYear - index)
      .map((year) => `<option value="${year}">${year}</option>`)
      .join("");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      setButtonLoading(submitButton, true, editingExpenseId ? "Updating..." : "Saving...");

      if (editingExpenseId) {
        await updatePersonalExpense(editingExpenseId, payload);
        showToast("Personal expense updated successfully.");
      } else {
        await createPersonalExpense(payload);
        showToast("Personal expense added successfully.");
      }

      resetForm();
      await loadPageData();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  cancelEditButton.addEventListener("click", resetForm);

  filtersForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadPageData();
  });

  yearSelect.addEventListener("change", loadAnalytics);

  buildYearOptions();
  monthFilter.value = getCurrentMonthValue();
  onThemeChange(() => {
    if (latestAnalyticsData) {
      renderAnalytics(latestAnalyticsData);
    }
  });
  resetForm();
  loadPageData();
}

