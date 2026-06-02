import { createExpense, getExpense, updateExpense } from "../api/expenseApi.js";
import { getGroup } from "../api/groupApi.js";
import { renderAppLayout } from "../components/layout.js";
import { renderState, setButtonLoading, showToast } from "../components/ui.js";
import { escapeHtml, fillSelectOptions, formatCurrency, getQueryParam } from "../utils/helpers.js";
import { requireAuth } from "../utils/guards.js";

if (requireAuth()) {
  const groupId = getQueryParam("group");
  const expenseId = getQueryParam("expense");

  if (!groupId) {
    window.location.href = "/pages/groups.html";
  }

  renderAppLayout({
    title: expenseId ? "Edit Expense" : "Add Expense",
    subtitle: "Create a clean expense entry with flexible splitting and optional receipt upload.",
    activeNav: "groups",
    actionsHtml: `<a class="btn btn-secondary" href="/pages/single-group.html?group=${groupId}">Back to group</a>`
  });

  const form = document.getElementById("expenseForm");
  const paidBySelect = document.getElementById("paidBy");
  const categorySelect = document.getElementById("categorySelect");
  const customCategoryWrap = document.getElementById("customCategoryWrap");
  const splitTypeSelect = document.getElementById("splitType");
  const splitMembersContainer = document.getElementById("splitMembersContainer");
  const splitSummary = document.getElementById("splitSummary");
  const receiptPreview = document.getElementById("receiptPreview");
  const receiptImageInput = document.getElementById("receiptImage");
  const cancelExpenseLink = document.getElementById("cancelExpenseLink");
  const titleInput = document.getElementById("title");
  const amountInput = document.getElementById("amount");
  const dateInput = document.getElementById("date");
  const descriptionInput = document.getElementById("description");
  const customCategoryInput = document.getElementById("customCategory");
  const expenseHeading = document.getElementById("expensePageHeading");
  const expenseSubheading = document.getElementById("expensePageSubheading");

  let members = [];
  let splitState = [];
  let existingReceiptImage = "";

  cancelExpenseLink.href = `/pages/single-group.html?group=${groupId}`;
  dateInput.value = new Date().toISOString().split("T")[0];

  const toggleCustomCategory = () => {
    customCategoryWrap.classList.toggle("hidden", categorySelect.value !== "custom");
  };

  const renderReceiptPreview = (imagePath) => {
    if (!imagePath) {
      receiptPreview.innerHTML = "";
      return;
    }

    receiptPreview.innerHTML = `
      <div class="receipt-preview">
        <strong>Receipt preview</strong>
        <img src="${escapeHtml(imagePath)}" alt="Receipt preview" />
      </div>
    `;
  };

  const buildDefaultSplitState = (existingSplits = []) => {
    splitState = members.map((member) => {
      const existingSplit = existingSplits.find((item) => {
        const splitUserId = item.user?._id || item.user;
        return splitUserId === member.userId;
      });

      return {
        user: member.userId,
        name: member.name,
        selected: existingSplit ? true : existingSplits.length === 0,
        amount: existingSplit?.amount ?? "",
        percentage: existingSplit?.percentage ?? ""
      };
    });
  };

  const getSelectedMembers = () => splitState.filter((member) => member.selected);

  const updateSplitSummary = () => {
    const totalAmount = Number(amountInput.value) || 0;
    const selectedMembers = getSelectedMembers();

    if (!selectedMembers.length) {
      renderState(splitSummary, "Splitting with ghosts? 👻", "Choose at least one roommate to split this expense with.");
      return;
    }

    if (splitTypeSelect.value === "equal") {
      const perHead = totalAmount ? totalAmount / selectedMembers.length : 0;
      splitSummary.innerHTML = `
        <div class="soft-card">
          <strong>Equal split</strong>
          <p>${selectedMembers.length} selected member(s) • Approx ${formatCurrency(perHead)} each</p>
        </div>
      `;
      return;
    }

    if (splitTypeSelect.value === "exact") {
      const exactTotal = selectedMembers.reduce((sum, member) => sum + (Number(member.amount) || 0), 0);
      splitSummary.innerHTML = `
        <div class="soft-card">
          <strong>Exact split total</strong>
          <p>${formatCurrency(exactTotal)} entered out of ${formatCurrency(totalAmount)}</p>
        </div>
      `;
      return;
    }

    const percentageTotal = selectedMembers.reduce(
      (sum, member) => sum + (Number(member.percentage) || 0),
      0
    );

    splitSummary.innerHTML = `
      <div class="soft-card">
        <strong>Percentage split total</strong>
        <p>${percentageTotal}% entered out of 100%</p>
      </div>
    `;
  };

  const renderSplitMembers = () => {
    splitMembersContainer.innerHTML = splitState
      .map(
        (member, index) => `
          <article class="split-member-card">
            <div class="item-head">
              <label class="item-head">
                <input type="checkbox" class="split-select" data-index="${index}" ${
                  member.selected ? "checked" : ""
                } />
                <span>${escapeHtml(member.name)}</span>
              </label>
              ${
                splitTypeSelect.value === "equal"
                  ? `<span class="item-meta">Equal share</span>`
                  : splitTypeSelect.value === "exact"
                    ? `<input class="split-input" data-field="amount" data-index="${index}" type="number" min="0" step="0.01" placeholder="Exact amount" value="${member.amount}" />`
                    : `<input class="split-input" data-field="percentage" data-index="${index}" type="number" min="0" step="0.01" placeholder="Percentage" value="${member.percentage}" />`
              }
            </div>
          </article>
        `
      )
      .join("");

    splitMembersContainer.querySelectorAll(".split-select").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const index = Number(checkbox.dataset.index);
        splitState[index].selected = checkbox.checked;
        updateSplitSummary();
      });
    });

    splitMembersContainer.querySelectorAll(".split-input").forEach((input) => {
      input.addEventListener("input", () => {
        const index = Number(input.dataset.index);
        const field = input.dataset.field;
        splitState[index][field] = input.value;
        updateSplitSummary();
      });
    });

    updateSplitSummary();
  };

  const buildSplitPayload = () =>
    splitState.map((member) => ({
      user: member.user,
      selected: member.selected,
      amount: member.amount,
      percentage: member.percentage
    }));

  const loadGroup = async () => {
    const data = await getGroup(groupId);
    members = data.group.members;
    fillSelectOptions(paidBySelect, members, {
      valueKey: "userId",
      formatter: (member) => member.name
    });
    buildDefaultSplitState();
    renderSplitMembers();
  };

  const loadExpense = async () => {
    if (!expenseId) {
      return;
    }

    const data = await getExpense(groupId, expenseId);
    const expense = data.expense;

    expenseHeading.textContent = "Edit expense";
    expenseSubheading.textContent = "Update the amount, split logic, details, or receipt.";
    titleInput.value = expense.title;
    amountInput.value = expense.amount;
    dateInput.value = new Date(expense.date).toISOString().split("T")[0];
    descriptionInput.value = expense.description;
    paidBySelect.value = expense.paidBy._id;
    categorySelect.value = expense.category;
    customCategoryInput.value = expense.customCategory || "";
    splitTypeSelect.value = expense.splitType;
    existingReceiptImage = expense.receiptImage || "";
    toggleCustomCategory();
    renderReceiptPreview(existingReceiptImage);
    buildDefaultSplitState(expense.splitMembers);
    renderSplitMembers();
  };

  receiptImageInput?.addEventListener("change", () => {
    const file = receiptImageInput.files?.[0];

    if (!file) {
      renderReceiptPreview(existingReceiptImage);
      return;
    }

    renderReceiptPreview(URL.createObjectURL(file));
  });

  categorySelect?.addEventListener("change", toggleCustomCategory);
  splitTypeSelect?.addEventListener("change", renderSplitMembers);
  amountInput?.addEventListener("input", updateSplitSummary);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const totalAmount = Number(amountInput.value) || 0;
    const selectedMembers = getSelectedMembers();

    if (totalAmount <= 0) {
      showToast("Please enter an amount greater than 0.", "error");
      return;
    }

    if (!selectedMembers.length) {
      showToast("Please select at least one roommate for this expense split.", "error");
      return;
    }

    // Exact split validation
    if (splitTypeSelect.value === "exact") {
      const exactTotal = selectedMembers.reduce((sum, member) => sum + (Number(member.amount) || 0), 0);
      if (Math.abs(exactTotal - totalAmount) > 0.01) {
        showToast(`Sum of exact splits (${formatCurrency(exactTotal)}) must equal the total expense amount (${formatCurrency(totalAmount)}).`, "error");
        return;
      }
    }

    // Percentage split validation
    if (splitTypeSelect.value === "percentage") {
      const percentageTotal = selectedMembers.reduce((sum, member) => sum + (Number(member.percentage) || 0), 0);
      if (Math.abs(percentageTotal - 100) > 0.01) {
        showToast(`Sum of percentage splits (${percentageTotal}%) must equal exactly 100%.`, "error");
        return;
      }
    }

    formData.set("splitMembers", JSON.stringify(buildSplitPayload()));

    try {
      setButtonLoading(submitButton, true, expenseId ? "Updating..." : "Saving...");

      if (expenseId) {
        await updateExpense(groupId, expenseId, formData);
        showToast("Expense updated successfully. 🎉");
      } else {
        await createExpense(groupId, formData);
        showToast("Expense added successfully. 💸");
      }

      window.location.href = `/pages/single-group.html?group=${groupId}`;
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  const initialize = async () => {
    try {
      await loadGroup();
      await loadExpense();
      toggleCustomCategory();
    } catch (error) {
      showToast(error.message, "error");
      renderState(form, "Expense form unavailable", "Could not load group or expense details.");
    }
  };

  initialize();
}
