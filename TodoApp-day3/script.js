const todoInput = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");
const searchInput = document.getElementById("searchInput");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterButtons = document.querySelectorAll(".filter-btn");
const taskCount = document.getElementById("taskCount");
const activeCount = document.getElementById("activeCount");

let todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";
let searchTerm = "";

// Save the current todo list to LocalStorage so tasks persist on reload.
function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

// Return todos that match the current search term and filter.
function getVisibleTodos() {
    return todos.filter(todo => {
        const matchesSearch = todo.text.toLowerCase().includes(searchTerm);

        if (currentFilter === "active") {
            return !todo.completed && matchesSearch;
        }

        if (currentFilter === "completed") {
            return todo.completed && matchesSearch;
        }

        return matchesSearch;
    });
}

// Update counts in the UI for total and active tasks.
function updateCounts() {
    const total = todos.length;
    const active = todos.filter(todo => !todo.completed).length;

    taskCount.textContent = `${total} task${total === 1 ? "" : "s"}`;
    activeCount.textContent = `${active} active`;
}

// Highlight the active filter button.
function setActiveFilterButton() {
    filterButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.filter === currentFilter);
    });
}

// Render tasks in the UI and save state.
function renderTodos() {
    const visibleTodos = getVisibleTodos();
    todoList.innerHTML = "";

    if (visibleTodos.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = "No tasks found. Add a task or clear the search.";
        todoList.appendChild(emptyItem);

        updateCounts();
        saveTodos();
        return;
    }

    visibleTodos.forEach(todo => {
        const li = document.createElement("li");
        li.className = `todo-item${todo.completed ? " completed" : ""}`;
        li.dataset.id = todo.id;

        li.innerHTML = `
            <button class="todo-checkbox" aria-label="Toggle task complete">
                ${todo.completed ? "✔" : ""}
            </button>
            <span class="todo-text">${todo.text}</span>
            <div class="todo-actions">
                <button class="todo-action edit" data-action="edit" aria-label="Edit task">✏️</button>
                <button class="todo-action delete" data-action="delete" aria-label="Delete task">❌</button>
            </div>
        `;

        todoList.appendChild(li);
    });

    updateCounts();
    saveTodos();
}

// Add a new todo item.
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) {
        todoInput.focus();
        return;
    }

    todos.push({ id: Date.now(), text, completed: false });
    todoInput.value = "";
    renderTodos();
}

// Toggle completion for a task.
function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    renderTodos();
}

// Remove a task from the list.
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    renderTodos();
}

// Edit the text of a task using a browser prompt.
function editTodo(id) {
    const todo = todos.find(item => item.id === id);
    if (!todo) return;

    const updatedText = prompt("Edit task", todo.text);
    if (updatedText === null) return;

    const trimmedText = updatedText.trim();
    if (!trimmedText) return;

    todo.text = trimmedText;
    renderTodos();
}

// Remove all completed tasks.
function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    renderTodos();
}

// Use event delegation inside the todo list for toggle, edit, and delete actions.
todoList.addEventListener("click", event => {
    const item = event.target.closest("li");
    if (!item) return;

    const id = Number(item.dataset.id);
    const action = event.target.dataset.action;

    if (action === "edit") {
        editTodo(id);
        return;
    }

    if (action === "delete") {
        deleteTodo(id);
        return;
    }

    if (event.target.closest(".todo-checkbox") || event.target.classList.contains("todo-text")) {
        toggleTodo(id);
    }
});

addBtn.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        addTodo();
    }
});

searchInput.addEventListener("input", event => {
    searchTerm = event.target.value.toLowerCase();
    renderTodos();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        setActiveFilterButton();
        renderTodos();
    });
});

if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener("click", clearCompleted);
}

setActiveFilterButton();
renderTodos();
