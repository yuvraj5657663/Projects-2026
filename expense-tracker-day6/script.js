const titleInput = document.getElementById("titleInput");
const amountInput = document.getElementById("amountInput");
const fileInput = document.getElementById("fileInput");
const typeInput = document.getElementById("typeInput");
const categoryInput = document.getElementById("categoryInput");
const addBtn = document.getElementById("addBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const searchInput = document.getElementById("searchInput");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const balanceEl = document.getElementById("balance");
const transactionList = document.getElementById("transactionList");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editingId = null;

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function formatAmount(amount) {
    return `Rs. ${amount.toFixed(2)}`;
}

function formatDateTime(dateValue) {
    return new Date(dateValue).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function resetForm() {
    titleInput.value = "";
    amountInput.value = "";
    fileInput.value = "";
    typeInput.value = "income";
    categoryInput.value = "Food";
    editingId = null;
    addBtn.textContent = "Add Transaction";
    cancelEditBtn.hidden = true;
    titleInput.focus();
}

function updateSummary() {
    let income = 0;
    let expense = 0;

    transactions.forEach((transaction) => {
        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expense += transaction.amount;
        }
    });

    const balance = income - expense;
    incomeEl.textContent = formatAmount(income);
    expenseEl.textContent = formatAmount(expense);
    balanceEl.textContent = formatAmount(balance);
}

function createMetaLine(transaction) {
    const meta = document.createElement("small");
    meta.className = "transaction-meta";
    meta.textContent = `${transaction.category || "Other"} • ${formatDateTime(transaction.createdAt || transaction.id)}`;
    return meta;
}

function renderTransactions() {
    transactionList.innerHTML = "";

    const searchText = searchInput.value.trim().toLowerCase();
    const filteredTransactions = transactions.filter((transaction) =>
        transaction.title.toLowerCase().includes(searchText)
    );

    if (filteredTransactions.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = searchText ? "No matching transactions found." : "No transactions yet.";
        transactionList.appendChild(emptyMessage);
    }

    filteredTransactions.forEach((transaction) => {
        const li = document.createElement("li");
        li.className = transaction.type;

        const details = document.createElement("div");
        const title = document.createElement("strong");
        const amount = document.createElement("span");
        const actions = document.createElement("div");
        const editBtn = document.createElement("button");
        const deleteBtn = document.createElement("button");

        title.textContent = transaction.title;
        amount.textContent = formatAmount(transaction.amount);

        editBtn.className = "edit-btn";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => editTransaction(transaction.id));

        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteTransaction(transaction.id));

        actions.className = "transaction-actions";
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        details.appendChild(title);
        details.appendChild(document.createElement("br"));
        details.appendChild(amount);
        details.appendChild(document.createElement("br"));
        details.appendChild(createMetaLine(transaction));

        if (transaction.fileName) {
            const fileName = document.createElement("small");
            fileName.className = "file-name";
            fileName.textContent = `Receipt: ${transaction.fileName}`;
            details.appendChild(document.createElement("br"));
            details.appendChild(fileName);
        }

        li.appendChild(details);
        li.appendChild(actions);

        transactionList.appendChild(li);
    });

    updateSummary();
    saveTransactions();
}

function addOrUpdateTransaction() {
    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const file = fileInput.files[0];

    if (title === "" || Number.isNaN(amount) || amount <= 0) {
        alert("Please enter valid data.");
        return;
    }

    if (editingId) {
        transactions = transactions.map((transaction) => {
            if (transaction.id !== editingId) {
                return transaction;
            }

            return {
                ...transaction,
                title,
                amount,
                type,
                category,
                fileName: file ? file.name : transaction.fileName,
            };
        });
    } else {
        transactions.push({
            id: Date.now(),
            title,
            amount,
            type,
            category,
            fileName: file ? file.name : "",
            createdAt: new Date().toISOString(),
        });
    }

    resetForm();
    renderTransactions();
}

function editTransaction(id) {
    const transaction = transactions.find((item) => item.id === id);

    if (!transaction) {
        return;
    }

    editingId = id;
    titleInput.value = transaction.title;
    amountInput.value = transaction.amount;
    typeInput.value = transaction.type;
    categoryInput.value = transaction.category || "Other";
    fileInput.value = "";
    addBtn.textContent = "Update Transaction";
    cancelEditBtn.hidden = false;
    titleInput.focus();
}

function deleteTransaction(id) {
    transactions = transactions.filter((transaction) => transaction.id !== id);

    if (editingId === id) {
        resetForm();
    }

    renderTransactions();
}

function clearAllTransactions() {
    if (transactions.length === 0) {
        return;
    }

    const shouldClear = confirm("Clear all transactions?");

    if (!shouldClear) {
        return;
    }

    transactions = [];
    localStorage.removeItem("transactions");
    resetForm();
    renderTransactions();
}

addBtn.addEventListener("click", addOrUpdateTransaction);
cancelEditBtn.addEventListener("click", resetForm);
clearAllBtn.addEventListener("click", clearAllTransactions);
searchInput.addEventListener("input", renderTransactions);
amountInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addOrUpdateTransaction();
    }
});

renderTransactions();
