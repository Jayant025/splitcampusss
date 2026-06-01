import { deleteExpense, getExpenses } from "../api/expenseApi.js";
import {
  addMember,
  getGroupDashboard,
  leaveGroup,
  removeMember
} from "../api/groupApi.js";
import { renderAppLayout } from "../components/layout.js";
import { renderState, setButtonLoading, showToast } from "../components/ui.js";
import { getStoredUser } from "../utils/auth.js";
import {
  escapeHtml,
  fillSelectOptions,
  formatCurrency,
  formatDate,
  formatDateTime,
  getQueryParam
} from "../utils/helpers.js";
import { requireAuth } from "../utils/guards.js";

if (requireAuth()) {
  const groupId = getQueryParam("group");

  if (!groupId) {
    window.location.href = "/pages/groups.html";
  }

  renderAppLayout({
    title: "Group Details",
    subtitle: "Manage members, balances, activity, and expenses in one place.",
    activeNav: "groups",
    actionsHtml: `
      <a class="btn btn-secondary" href="/pages/settlements.html?group=${groupId}">Settlements</a>
      <a class="btn btn-secondary" href="/pages/analytics.html?group=${groupId}">Analytics</a>
      <a class="btn btn-primary" href="/pages/add-expense.html?group=${groupId}">Add expense</a>
    `
  });

  const currentUser = getStoredUser();
  const groupHero = document.getElementById("groupHero");
  const membersList = document.getElementById("membersList");
  const addMemberForm = document.getElementById("addMemberForm");
  const balanceSummary = document.getElementById("balanceSummary");
  const activityList = document.getElementById("activityList");
  const debtSuggestions = document.getElementById("debtSuggestions");
  const expensesList = document.getElementById("expensesList");
  const expenseFiltersForm = document.getElementById("expenseFiltersForm");
  const memberFilter = document.getElementById("member");

  let groupData = null;
  let isAdmin = false;

  const renderGroupHero = () => {
    if (!groupData) {
      return;
    }

    groupHero.innerHTML = `
      <div class="group-hero">
        ${
          groupData.group.image
            ? `<img class="group-avatar" src="${escapeHtml(groupData.group.image)}" alt="${escapeHtml(
                groupData.group.name
              )}" />`
            : `<div class="group-avatar avatar-fallback">${escapeHtml(
                groupData.group.name.slice(0, 2).toUpperCase()
              )}</div>`
        }
        <div class="stack-md">
          <div class="section-header">
            <div>
              <span class="eyebrow">${escapeHtml(groupData.group.type)}</span>
              <h2>${escapeHtml(groupData.group.name)}</h2>
              <p>${escapeHtml(groupData.group.description || "No description added yet.")}</p>
            </div>
            <div class="group-hero-actions">
              <span class="badge">Invite code ${escapeHtml(groupData.group.inviteCode)}</span>
              <button id="leaveGroupButton" class="btn btn-danger" type="button">Leave group</button>
            </div>
          </div>
          <div class="item-meta">
            ${groupData.group.memberCount} members • ${formatCurrency(
      groupData.summary.totalExpenses
    )} total expenses
          </div>
        </div>
      </div>
    `;

    document.getElementById("leaveGroupButton")?.addEventListener("click", async () => {
      const confirmed = window.confirm("Leave this group?");

      if (!confirmed) {
        return;
      }

      try {
        await leaveGroup(groupId);
        showToast("You left the group.");
        window.location.href = "/pages/groups.html";
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  };

  const renderMembers = () => {
    const members = groupData.group.members || [];
    const currentMember = members.find((member) => member.userId === currentUser?._id);
    isAdmin = currentMember?.role === "admin";
    addMemberForm.classList.toggle("hidden", !isAdmin);

    fillSelectOptions(memberFilter, members, {
      placeholder: "All members",
      valueKey: "userId",
      formatter: (member) => member.name
    });

    membersList.innerHTML = `
      <div class="member-list">
        ${members
          .map(
            (member) => `
              <article class="member-item">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(member.name)}</strong>
                    <div class="item-meta">${escapeHtml(member.email)}</div>
                  </div>
                  <span class="badge">${escapeHtml(member.role)}</span>
                </div>
                <div class="item-actions">
                  <span class="item-meta">Joined ${formatDate(member.joinedAt)}</span>
                  ${
                    isAdmin && member.userId !== currentUser?._id
                      ? `<button class="btn btn-danger remove-member-button" data-user-id="${member.userId}" type="button">Remove</button>`
                      : ""
                  }
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;

    membersList.querySelectorAll(".remove-member-button").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = button.dataset.userId;
        const confirmed = window.confirm("Remove this member from the group?");

        if (!confirmed) {
          return;
        }

        try {
          await removeMember(groupId, userId);
          showToast("Member removed successfully.");
          loadGroupDashboard();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  };

  const renderBalances = () => {
    const members = groupData.balances || [];

    balanceSummary.innerHTML = `
      <div class="member-list">
        ${members
          .map((member) => {
            const balanceClass =
              member.netBalance > 0
                ? "positive-text"
                : member.netBalance < 0
                  ? "negative-text"
                  : "neutral-text";

            return `
              <article class="member-item">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(member.name)}</strong>
                    <div class="item-meta">Paid ${formatCurrency(member.totalPaid)} • Owes ${formatCurrency(
              member.totalOwed
            )}</div>
                  </div>
                  <strong class="${balanceClass}">${formatCurrency(member.netBalance)}</strong>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;

    if (!groupData.simplifiedDebts.length) {
      renderState(
        debtSuggestions,
        "No pending debts",
        "The group is currently balanced based on existing expenses and settlements."
      );
      return;
    }

    debtSuggestions.innerHTML = `
      <div class="settlement-list">
        ${groupData.simplifiedDebts
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

  const renderActivity = () => {
    if (!groupData.recentActivity.length) {
      renderState(activityList, "No recent activity", "Activity will show up when members use the group.");
      return;
    }

    activityList.innerHTML = `
      <div class="activity-list">
        ${groupData.recentActivity
          .map(
            (activity) => `
              <article class="activity-item">
                <strong>${escapeHtml(activity.message)}</strong>
                <div class="item-meta">${formatDateTime(activity.createdAt)}</div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const renderExpenses = (expenses) => {
    if (!expenses.length) {
      renderState(
        expensesList,
        "No expenses found",
        "Try changing the filters or add your first expense to this group."
      );
      return;
    }

    expensesList.innerHTML = `
      <div class="expense-list">
        ${expenses
          .map((expense) => {
            const canManageExpense =
              expense.createdBy?._id === currentUser?._id || isAdmin;

            return `
              <article class="expense-item">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(expense.title)}</strong>
                    <div class="item-meta">${escapeHtml(expense.categoryLabel)} • Paid by ${escapeHtml(
              expense.paidBy.name
            )}</div>
                  </div>
                  <strong>${formatCurrency(expense.amount)}</strong>
                </div>
                <p>${escapeHtml(expense.description || "No description added.")}</p>
                <div class="item-meta">Date: ${formatDate(expense.date)}</div>
                <div class="item-meta">
                  Split: ${expense.splitMembers
                    .map(
                      (split) =>
                        `${escapeHtml(split.user.name)} (${formatCurrency(split.amount)})`
                    )
                    .join(", ")}
                </div>
                ${
                  expense.receiptImage
                    ? `<div class="item-meta"><a href="${escapeHtml(
                        expense.receiptImage
                      )}" target="_blank" rel="noreferrer">View receipt</a></div>`
                    : ""
                }
                <div class="item-actions">
                  <span class="item-meta">Updated ${formatDateTime(expense.updatedAt)}</span>
                  <div class="item-actions">
                    ${
                      canManageExpense
                        ? `<a class="btn btn-secondary" href="/pages/add-expense.html?group=${groupId}&expense=${expense._id}">Edit</a>`
                        : ""
                    }
                    ${
                      canManageExpense
                        ? `<button class="btn btn-danger delete-expense-button" data-expense-id="${expense._id}" type="button">Delete</button>`
                        : ""
                    }
                  </div>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;

    expensesList.querySelectorAll(".delete-expense-button").forEach((button) => {
      button.addEventListener("click", async () => {
        const expenseId = button.dataset.expenseId;
        const confirmed = window.confirm("Delete this expense?");

        if (!confirmed) {
          return;
        }

        try {
          await deleteExpense(groupId, expenseId);
          showToast("Expense deleted successfully.");
          loadGroupDashboard();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  };

  const loadExpenses = async () => {
    const filters = Object.fromEntries(new FormData(expenseFiltersForm).entries());

    try {
      const data = await getExpenses(groupId, filters);
      renderExpenses(data.expenses);
    } catch (error) {
      showToast(error.message, "error");
      renderState(expensesList, "Expenses unavailable", "Could not load the expense list.");
    }
  };

  const loadGroupDashboard = async () => {
    try {
      groupHero.innerHTML = "";
      renderState(groupHero, "Loading group", "Fetching group details, balances, and activity.");
      groupData = await getGroupDashboard(groupId);
      renderGroupHero();
      renderMembers();
      renderBalances();
      renderActivity();
      await loadExpenses();
    } catch (error) {
      showToast(error.message, "error");
      renderState(groupHero, "Group unavailable", "Could not load the selected group.");
      renderState(membersList, "Members unavailable", "Member details could not be loaded.");
      renderState(balanceSummary, "Balances unavailable", "Balance data could not be loaded.");
      renderState(activityList, "Activity unavailable", "Recent activity could not be loaded.");
      renderState(expensesList, "Expenses unavailable", "Expense list could not be loaded.");
    }
  };

  addMemberForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = addMemberForm.querySelector('button[type="submit"]');
    const formData = new FormData(addMemberForm);

    try {
      setButtonLoading(submitButton, true, "Adding...");
      await addMember(groupId, {
        email: formData.get("email")
      });
      addMemberForm.reset();
      showToast("Member added successfully.");
      loadGroupDashboard();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  expenseFiltersForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    loadExpenses();
  });

  loadGroupDashboard();
}
