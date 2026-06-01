import { getGroupBalances, getGroupDashboard } from "../api/groupApi.js";
import { createSettlement, getSettlements } from "../api/settlementApi.js";
import { renderAppLayout } from "../components/layout.js";
import { renderState, setButtonLoading, showToast } from "../components/ui.js";
import {
  escapeHtml,
  fillSelectOptions,
  formatCurrency,
  formatDate,
  getQueryParam
} from "../utils/helpers.js";
import { requireAuth } from "../utils/guards.js";

if (requireAuth()) {
  const groupId = getQueryParam("group");

  if (!groupId) {
    window.location.href = "/pages/groups.html";
  }

  renderAppLayout({
    title: "Settlements",
    subtitle: "Record full or partial payments and keep the group history easy to follow.",
    activeNav: "groups",
    actionsHtml: `<a class="btn btn-secondary" href="/pages/single-group.html?group=${groupId}">Back to group</a>`
  });

  const groupInfo = document.getElementById("settlementGroupInfo");
  const settlementForm = document.getElementById("settlementForm");
  const paidBySelect = document.getElementById("paidBy");
  const receivedBySelect = document.getElementById("receivedBy");
  const suggestedSettlements = document.getElementById("suggestedSettlements");
  const settlementHistory = document.getElementById("settlementHistory");

  settlementForm.date.value = new Date().toISOString().split("T")[0];

  const renderGroupInfo = (group) => {
    groupInfo.innerHTML = `
      <div class="group-hero">
        <div class="group-avatar avatar-fallback">${escapeHtml(group.name.slice(0, 2).toUpperCase())}</div>
        <div class="stack-md">
          <div>
            <span class="eyebrow">${escapeHtml(group.type)}</span>
            <h2>${escapeHtml(group.name)}</h2>
          </div>
          <div class="item-meta">Use this page to record settlement history for the selected group.</div>
        </div>
      </div>
    `;
  };

  const renderSuggestions = (items) => {
    if (!items.length) {
      renderState(
        suggestedSettlements,
        "No settlement suggestions",
        "The group is already balanced based on the current records."
      );
      return;
    }

    suggestedSettlements.innerHTML = `
      <div class="settlement-list">
        ${items
          .map(
            (item) => `
              <article class="suggestion-item">
                <strong>${escapeHtml(item.fromName)} should pay ${escapeHtml(item.toName)}</strong>
                <div class="item-meta">${formatCurrency(item.amount)}</div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const renderHistory = (settlements) => {
    if (!settlements.length) {
      renderState(
        settlementHistory,
        "No settlement history",
        "Recorded payments between members will appear here."
      );
      return;
    }

    settlementHistory.innerHTML = `
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
                    <div class="item-meta">${formatDate(settlement.date)}</div>
                  </div>
                  <strong>${formatCurrency(settlement.amount)}</strong>
                </div>
                <div class="item-meta">${escapeHtml(settlement.note || "No note added.")}</div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const loadPageData = async () => {
    try {
      const [dashboardData, balanceData, settlementData] = await Promise.all([
        getGroupDashboard(groupId),
        getGroupBalances(groupId),
        getSettlements(groupId)
      ]);

      renderGroupInfo(dashboardData.group);
      fillSelectOptions(paidBySelect, dashboardData.group.members, {
        valueKey: "userId",
        formatter: (member) => member.name
      });
      fillSelectOptions(receivedBySelect, dashboardData.group.members, {
        valueKey: "userId",
        formatter: (member) => member.name
      });
      renderSuggestions(balanceData.simplifiedDebts);
      renderHistory(settlementData.settlements);
    } catch (error) {
      showToast(error.message, "error");
      renderState(groupInfo, "Settlements unavailable", "Could not load the selected group.");
      renderState(
        suggestedSettlements,
        "Suggestions unavailable",
        "Could not load settlement suggestions."
      );
      renderState(
        settlementHistory,
        "History unavailable",
        "Could not load the settlement history."
      );
    }
  };

  settlementForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = settlementForm.querySelector('button[type="submit"]');
    const formData = new FormData(settlementForm);

    try {
      setButtonLoading(submitButton, true, "Saving...");
      await createSettlement(groupId, {
        paidBy: formData.get("paidBy"),
        receivedBy: formData.get("receivedBy"),
        amount: formData.get("amount"),
        date: formData.get("date"),
        note: formData.get("note")
      });
      settlementForm.reset();
      settlementForm.date.value = new Date().toISOString().split("T")[0];
      showToast("Settlement recorded successfully.");
      loadPageData();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  loadPageData();
}
