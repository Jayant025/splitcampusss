import { createGroup, getGroups, joinGroup } from "../api/groupApi.js";
import { renderAppLayout } from "../components/layout.js";
import { renderState, setButtonLoading, showToast } from "../components/ui.js";
import { escapeHtml, formatCurrency, formatDate } from "../utils/helpers.js";
import { requireAuth } from "../utils/guards.js";

if (requireAuth()) {
  renderAppLayout({
    title: "Groups",
    subtitle: "Create, join, and manage the spaces where your shared expenses live.",
    activeNav: "groups"
  });

  const createGroupForm = document.getElementById("createGroupForm");
  const joinGroupForm = document.getElementById("joinGroupForm");
  const groupsList = document.getElementById("groupsList");

  const renderGroups = (groups) => {
    if (!groups.length) {
      renderState(
        groupsList,
        "No groups available",
        "Create a group or join one with an invite code to get started."
      );
      return;
    }

    groupsList.innerHTML = `
      <div class="group-list">
        ${groups
          .map(
            (group) => `
              <article class="group-item">
                <div class="item-head">
                  <div>
                    <strong>${escapeHtml(group.name)}</strong>
                    <div class="item-meta">${escapeHtml(group.type)} • Invite code ${escapeHtml(
              group.inviteCode
            )}</div>
                  </div>
                  <span class="badge">${group.currentUserRole}</span>
                </div>
                <p>${escapeHtml(group.description || "No description added yet.")}</p>
                <div class="item-meta">
                  ${group.memberCount} members • ${group.expenseCount} expenses • ${formatCurrency(
              group.totalExpenses
            )}
                </div>
                <div class="item-actions">
                  <span class="item-meta">Updated ${formatDate(group.updatedAt)}</span>
                  <a class="btn btn-primary" href="/pages/single-group.html?group=${group._id}">Open group</a>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const loadGroups = async () => {
    try {
      const data = await getGroups();
      renderGroups(data.groups);
    } catch (error) {
      showToast(error.message, "error");
      renderState(groupsList, "Groups unavailable", "Please try loading the groups again.");
    }
  };

  createGroupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = createGroupForm.querySelector('button[type="submit"]');
    const formData = new FormData(createGroupForm);

    try {
      setButtonLoading(submitButton, true, "Creating...");
      await createGroup(formData);
      createGroupForm.reset();
      showToast("Group created successfully.");
      loadGroups();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  joinGroupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = joinGroupForm.querySelector('button[type="submit"]');
    const formData = new FormData(joinGroupForm);

    try {
      setButtonLoading(submitButton, true, "Joining...");
      await joinGroup({
        inviteCode: formData.get("inviteCode")
      });
      joinGroupForm.reset();
      showToast("Joined group successfully.");
      loadGroups();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  loadGroups();
}

