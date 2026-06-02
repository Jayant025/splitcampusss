import { getPersonalDashboard } from "../api/dashboardApi.js";
import { renderAppLayout } from "../components/layout.js";
import { renderState, showToast } from "../components/ui.js";
import { formatCurrency, formatDate, escapeHtml } from "../utils/helpers.js";
import { requireAuth } from "../utils/guards.js";

if (requireAuth()) {
  renderAppLayout({
    title: "Personal Dashboard",
    subtitle: "Track what you paid, what you owe, and the groups that matter right now.",
    activeNav: "dashboard",
    actionsHtml: '<a class="btn btn-primary" href="/pages/groups.html">Open groups</a>'
  });

  const statsGrid = document.getElementById("statsGrid");
  const activeGroups = document.getElementById("activeGroups");
  const recentExpenses = document.getElementById("recentExpenses");
  const recentSettlements = document.getElementById("recentSettlements");

  const renderStats = (stats) => {
    statsGrid.innerHTML = `
      <article class="card stat-card">
        <span>Cash Flow Out 💸</span>
        <strong class="value">${formatCurrency(stats.totalPaid)}</strong>
      </article>
      <article class="card stat-card">
        <span>Your Tab 📉</span>
        <strong class="value">${formatCurrency(stats.totalUserOwes)}</strong>
      </article>
      <article class="card stat-card">
        <span>Due To You 📈</span>
        <strong class="value">${formatCurrency(stats.totalOthersOweUser)}</strong>
      </article>
      <article class="card stat-card">
        <span>My Squads 🎒</span>
        <strong class="value">${stats.activeGroups}</strong>
      </article>
    `;
  };

  const renderGroups = (groups) => {
    if (!groups.length) {
      renderState(
        activeGroups,
        "Squadless! 🎒",
        "Create your first group to start splitting rent, food, cab fares, and weekend trips."
      );
      return;
    }

    activeGroups.innerHTML = `
      <div class="group-list">
        ${groups
          .map(
            (group) => `
              <article class="group-item">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(group.name)}</strong>
                    <div class="item-meta">${escapeHtml(group.type)} • ${group.memberCount} members</div>
                  </div>
                  <a class="btn btn-secondary" href="/pages/single-group.html?group=${group._id}">Open</a>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const renderExpenseList = (container, expenses) => {
    if (!expenses.length) {
      renderState(container, "Expense ledger is blank 📝", "No activity yet. Someone needs to buy the first Maggi! 🍜");
      return;
    }

    container.innerHTML = `
      <div class="expense-list">
        ${expenses
          .map(
            (expense) => `
              <article class="expense-item">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(expense.title)}</strong>
                    <div class="item-meta">${escapeHtml(expense.group.name)} • ${escapeHtml(
              expense.categoryLabel
            )}</div>
                  </div>
                  <strong>${formatCurrency(expense.amount)}</strong>
                </div>
                <div class="item-meta">Paid by ${escapeHtml(expense.paidBy.name)} on ${formatDate(
              expense.date
            )}</div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const renderSettlementList = (settlements) => {
    if (!settlements.length) {
      renderState(
        recentSettlements,
        "No settlements yet 🤝",
        "Friendships are balanced! Any settlements you record in your squads will show up here."
      );
      return;
    }

    recentSettlements.innerHTML = `
      <div class="settlement-list">
        ${settlements
          .map(
            (settlement) => `
              <article class="settlement-item">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(settlement.paidBy.name)} paid ${escapeHtml(
              settlement.receivedBy.name
            )}</strong>
                    <div class="item-meta">${escapeHtml(settlement.group.name)}</div>
                  </div>
                  <strong>${formatCurrency(settlement.amount)}</strong>
                </div>
                <div class="item-meta">${formatDate(settlement.date)}${
              settlement.note ? ` • ${escapeHtml(settlement.note)}` : ""
            }</div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const loadDashboard = async () => {
    try {
      renderState(statsGrid, "Hanging tight... 🎒", "Rummaging through your hostel bills!");
      const data = await getPersonalDashboard();
      renderStats(data.stats);
      renderGroups(data.groups);
      renderExpenseList(recentExpenses, data.recentExpenses);
      renderSettlementList(data.recentSettlements);
    } catch (error) {
      showToast(error.message, "error");
      renderState(statsGrid, "Could not load dashboard 💔", "Check your connection and try reloading.");
      renderState(activeGroups, "Groups unavailable", "The group list could not be loaded.");
      renderState(recentExpenses, "Expenses unavailable", "Recent expenses could not be loaded.");
      renderState(
        recentSettlements,
        "Settlements unavailable",
        "Recent settlements could not be loaded."
      );
    }
  };

  loadDashboard();
}

