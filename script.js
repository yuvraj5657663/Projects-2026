// ── Summary Elements ────────────────────────────────────────────
const incomeEl     = document.getElementById("income");
const expenseEl    = document.getElementById("expense");
const balanceEl    = document.getElementById("balance");
const entryCountEl = document.getElementById("entryCount");
const transactionList = document.getElementById("transactionList");
const clearAllBtn  = document.getElementById("clearAllBtn");
const searchInput  = document.getElementById("searchInput");
const addIncomeBtn  = document.getElementById("addIncomeBtn");
const addExpenseBtn = document.getElementById("addExpenseBtn");

// ── Income Form Elements ─────────────────────────────────────────
const incomeForm      = document.getElementById("incomeForm");
const iVoInput        = document.getElementById("iVoInput");
const iShgInput       = document.getElementById("iShgInput");
const iCategoryInput  = document.getElementById("iCategoryInput");
const iTitleInput     = document.getElementById("iTitleInput");
const iAmountInput    = document.getElementById("iAmountInput");
const iAdminFundInput = document.getElementById("iAdminFundInput");
const iFileInput      = document.getElementById("iFileInput");
const iAddBtn         = document.getElementById("iAddBtn");
const iCancelEditBtn  = document.getElementById("iCancelEditBtn");

// ── Expense Form Elements ─────────────────────────────────────────
const expenseForm     = document.getElementById("expenseForm");
const eVoInput        = document.getElementById("eVoInput");
const eShgInput       = document.getElementById("eShgInput");
const eCategoryInput  = document.getElementById("eCategoryInput");
const eTitleInput     = document.getElementById("eTitleInput");
const eAmountInput    = document.getElementById("eAmountInput");
const eCheckInput     = document.getElementById("eCheckinput"); // FIXED ID
const eFileInput      = document.getElementById("eFileInput");
const eAddBtn         = document.getElementById("eAddBtn");
const eCancelEditBtn  = document.getElementById("eCancelEditBtn");

// ── State ─────────────────────────────────────────────────────────
const storageKey = "jivikaVoTransactions";
let transactions = JSON.parse(localStorage.getItem(storageKey)) || [];
let editingIncomeId  = null;
let editingExpenseId = null;

// ── Helpers ───────────────────────────────────────────────────────
function saveTransactions() {
    localStorage.setItem(storageKey, JSON.stringify(transactions));
}

function formatAmount(amount) {
    return `Rs. ${amount.toFixed(2)}`;
}

function formatLabel(value) {
    if (!value) return "Not selected";
    return value
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function formatDateTime(dateValue) {
    return new Date(dateValue).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

// ── Reset Forms ───────────────────────────────────────────────────
function resetIncomeForm() {
    incomeForm.reset();
    editingIncomeId = null;
    iAddBtn.textContent = "Add Income";
    iCancelEditBtn.hidden = true;
}

function resetExpenseForm() {
    expenseForm.reset();
    editingExpenseId = null;
    eAddBtn.textContent = "Add Expense";
    eCancelEditBtn.hidden = true;
}

// ── Summary ───────────────────────────────────────────────────────
function updateSummary() {
    const totals = transactions.reduce(
        (result, t) => {
            result[t.type] += t.amount;
            return result;
        },
        { income: 0, expense: 0 }
    );

    incomeEl.textContent     = formatAmount(totals.income);
    expenseEl.textContent    = formatAmount(totals.expense);
    balanceEl.textContent    = formatAmount(totals.income - totals.expense);
    entryCountEl.textContent = transactions.length;
}

// ── Search Filter ─────────────────────────────────────────────────
function transactionMatchesSearch(transaction, searchText) {
    const searchableText = [
        transaction.title,
        transaction.vo,
        transaction.shg,
        transaction.category,
        transaction.adminFund,
        transaction.checkNumber,
    ]
        .join(" ")
        .toLowerCase();
    return searchableText.includes(searchText);
}

// ── Render List ───────────────────────────────────────────────────
function renderTransactions() {
    transactionList.innerHTML = "";

    const searchText = searchInput.value.trim().toLowerCase();
    const filtered = transactions.filter((t) =>
        transactionMatchesSearch(t, searchText)
    );

    if (filtered.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "empty-state";
        emptyMessage.textContent = searchText
            ? "No matching transactions found."
            : "No transactions added yet.";
        transactionList.appendChild(emptyMessage);
    }

    filtered.forEach((transaction) => {
        const item = document.createElement("li");
        item.className = `transaction-item ${transaction.type}`;

        const details = document.createElement("div");
        details.className = "transaction-details";

        const topLine = document.createElement("div");
        topLine.className = "transaction-topline";

        const title = document.createElement("strong");
        title.textContent = transaction.title;

        const amount = document.createElement("span");
        amount.textContent = formatAmount(transaction.amount);

        const meta = document.createElement("small");
        meta.textContent = `${formatLabel(transaction.vo)} – ${formatLabel(transaction.shg)} – ${formatLabel(transaction.category)} – ${formatDateTime(transaction.createdAt)}`;

        topLine.append(title, amount);
        details.append(topLine, meta);

        if (transaction.type === "income" && transaction.adminFund) {
            const adminFund = document.createElement("small");
            adminFund.textContent = `Admin fund: ${formatLabel(transaction.adminFund)}`;
            details.appendChild(adminFund);
        }

        if (transaction.type === "expense" && transaction.checkNumber) {
            const checkNum = document.createElement("small");
            checkNum.textContent = `Cheque No: ${transaction.checkNumber}`;
            details.appendChild(checkNum);
        }

        if (transaction.fileName) {
            const receipt = document.createElement("small");
            receipt.textContent = `Receipt: ${transaction.fileName}`;
            details.appendChild(receipt);
        }

        const actions = document.createElement("div");
        actions.className = "transaction-actions";

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => editTransaction(transaction.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteTransaction(transaction.id));

        actions.append(editBtn, deleteBtn);
        item.append(details, actions);
        transactionList.appendChild(item);
    });

    updateSummary();
    saveTransactions();
}

// ── Submit Handler (shared) ───────────────────────────────────────
function handleFormSubmit(event, type) {
    event.preventDefault();

    let vo, shg, category, title, amount, adminFund, checkNumber, file, editingId, form;

    if (type === "income") {
        form       = incomeForm;
        vo         = iVoInput.value;
        shg        = iShgInput.value;
        category   = iCategoryInput.value;
        title      = iTitleInput.value.trim();
        amount     = Number(iAmountInput.value);
        adminFund  = iAdminFundInput.value;
        file       = iFileInput.files[0];
        editingId  = editingIncomeId;
    } else {
        form       = expenseForm;
        vo         = eVoInput.value;
        shg        = eShgInput.value;
        category   = eCategoryInput.value;
        title      = eTitleInput.value.trim();
        amount     = Number(eAmountInput.value);
        checkNumber = eCheckInput.value; // Corrected
        file       = eFileInput.files[0];
        editingId  = editingExpenseId;
    }

    if (!form.checkValidity() || Number.isNaN(amount) || amount <= 0) {
        form.reportValidity();
        return;
    }

    const transactionData = {
        title,
        amount,
        type,
        vo,
        shg,
        category,
        adminFund: type === "income" ? adminFund : null,
        checkNumber: type === "expense" ? checkNumber : null,
        fileName: file ? file.name : "",
    };

    if (editingId) {
        transactions = transactions.map((t) =>
            t.id === editingId
                ? {
                      ...t,
                      ...transactionData,
                      fileName: transactionData.fileName || t.fileName,
                  }
                : t
        );
    } else {
        transactions.unshift({
            id: Date.now(),
            createdAt: new Date().toISOString(),
            ...transactionData,
        });
    }

    if (type === "income") resetIncomeForm();
    else resetExpenseForm();

    renderTransactions();
}

// ── Edit ──────────────────────────────────────────────────────────
function editTransaction(id) {
    const transaction = transactions.find((t) => t.id === id);
    if (!transaction) return;

    if (transaction.type === "income") {
        editingIncomeId       = id;
        iVoInput.value        = transaction.vo;
        iShgInput.value       = transaction.shg;
        iCategoryInput.value  = transaction.category;
        iTitleInput.value     = transaction.title;
        iAmountInput.value    = transaction.amount;
        iAdminFundInput.value = transaction.adminFund;
        iFileInput.value      = "";
        iAddBtn.textContent   = "Update Income";
        iCancelEditBtn.hidden = false;
        document.getElementById("incomePanel").scrollIntoView({ behavior: "smooth", block: "start" });
        iTitleInput.focus();
    } else {
        editingExpenseId      = id;
        eVoInput.value        = transaction.vo;
        eShgInput.value       = transaction.shg;
        eCategoryInput.value  = transaction.category;
        eTitleInput.value     = transaction.title;
        eAmountInput.value    = transaction.amount;
        eCheckInput.value     = transaction.checkNumber || ""; // Corrected
        eFileInput.value      = "";
        eAddBtn.textContent   = "Update Expense";
        eCancelEditBtn.hidden = false;
        document.getElementById("expensePanel").scrollIntoView({ behavior: "smooth", block: "start" });
        eTitleInput.focus();
    }
}

// ── Delete ────────────────────────────────────────────────────────
function deleteTransaction(id) {
    const transaction = transactions.find((t) => t.id === id);
    transactions = transactions.filter((t) => t.id !== id);
    if (transaction) {
        if (transaction.type === "income"  && editingIncomeId  === id) resetIncomeForm();
        if (transaction.type === "expense" && editingExpenseId === id) resetExpenseForm();
    }
    renderTransactions();
}

// ── Clear All ─────────────────────────────────────────────────────
function clearAllTransactions() {
    if (transactions.length === 0) return;
    if (!confirm("Clear all transactions?")) return;
    transactions = [];
    localStorage.removeItem(storageKey);
    resetIncomeForm();
    resetExpenseForm();
    renderTransactions();
}

// ── Quick-Add from summary card buttons ───────────────────────────
addIncomeBtn.addEventListener("click", () => {
    resetIncomeForm();
    document.getElementById("incomePanel").scrollIntoView({ behavior: "smooth", block: "start" });
    iVoInput.focus();
});

addExpenseBtn.addEventListener("click", () => {
    resetExpenseForm();
    document.getElementById("expensePanel").scrollIntoView({ behavior: "smooth", block: "start" });
    eVoInput.focus();
});

// ── Event Listeners ───────────────────────────────────────────────
incomeForm.addEventListener("submit",  (e) => handleFormSubmit(e, "income"));
expenseForm.addEventListener("submit", (e) => handleFormSubmit(e, "expense"));
iCancelEditBtn.addEventListener("click", resetIncomeForm);
eCancelEditBtn.addEventListener("click", resetExpenseForm);
clearAllBtn.addEventListener("click", clearAllTransactions);
searchInput.addEventListener("input", renderTransactions);

// ── Init ──────────────────────────────────────────────────────────
renderTransactions();
