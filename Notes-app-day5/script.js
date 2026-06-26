// DOM references for form controls, filters, and note list
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const categoryInput = document.getElementById("categoryInput");
const addBtn = document.getElementById("addBtn");
const notesContainer = document.getElementById("notesContainer");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("themeToggle");
const noteCount = document.getElementById("noteCount");

// Load saved app state from localStorage, fallback to defaults
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let currentTheme = localStorage.getItem("theme") || "dark";

// Category class map used for styling note badges
const categoryColors = {
    Work: "work",
    Personal: "personal",
};

// Persist notes array to localStorage so data remains after refresh
function saveNotes() {
    localStorage.setItem("notes", JSON.stringify(notes));
}

// Persist theme selection and apply attribute for CSS theme rules
function saveTheme() {
    localStorage.setItem("theme", currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
    themeToggle.textContent = currentTheme === "dark" ? "Switch to Light" : "Switch to Dark";
}

// Update visible note count in the toolbar
function updateNoteCount(count) {
    noteCount.textContent = `${count} note${count === 1 ? "" : "s"}`;
}

// Format createdAt timestamp for human-friendly display
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Render notes cards in the DOM, optionally using filtered data
function renderNotes(data = notes) {
    notesContainer.innerHTML = "";

    if (data.length === 0) {
        notesContainer.innerHTML = `<p class="empty-state">No notes found yet. Add your first note!</p>`;
        updateNoteCount(0);
        return;
    }

    data.forEach((note) => {
        const noteCard = document.createElement("div");
        noteCard.className = `note ${categoryColors[note.category] || "personal"}`;
        noteCard.draggable = true;
        noteCard.dataset.id = note.id;

        noteCard.innerHTML = `
            <div class="note-header">
                <div>
                    <h3>${note.title}</h3>
                    <span class="note-category">${note.category}</span>
                </div>
                <span class="note-id">${formatDate(note.createdAt)}</span>
            </div>
            <p>${note.content}</p>
            <div class="actions">
                <button class="edit-btn" onclick="editNote(${note.id})">Edit</button>
                <button class="delete-btn" onclick="deleteNote(${note.id})">Delete</button>
            </div>
        `;

        noteCard.addEventListener("dragstart", handleDragStart);
        noteCard.addEventListener("dragover", handleDragOver);
        noteCard.addEventListener("drop", handleDrop);
        noteCard.addEventListener("dragend", handleDragEnd);

        notesContainer.appendChild(noteCard);
    });

    saveNotes();
    updateNoteCount(data.length);
}

// Create a new note with category, timestamp, and persist it
function addNote() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const category = categoryInput.value;

    if (!title || !content) {
        alert("Please fill in both title and note content.");
        return;
    }

    const note = {
        id: Date.now(),
        title,
        content,
        category,
        createdAt: Date.now(),
    };

    notes.unshift(note);
    titleInput.value = "";
    contentInput.value = "";

    renderNotes();
}

addBtn.addEventListener("click", addNote);

function deleteNote(id) {
    notes = notes.filter((note) => note.id !== id);
    renderNotes();
}

function editNote(id) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const newTitle = prompt("Edit title:", note.title);
    const newContent = prompt("Edit content:", note.content);
    const newCategory = prompt("Edit category (Work or Personal):", note.category);

    if (newTitle !== null) note.title = newTitle.trim() || note.title;
    if (newContent !== null) note.content = newContent.trim() || note.content;
    if (newCategory !== null && ["Work", "Personal"].includes(newCategory.trim())) {
        note.category = newCategory.trim();
    }

    renderNotes();
}

searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();
    const filtered = notes.filter(
        (note) =>
            note.title.toLowerCase().includes(value) ||
            note.content.toLowerCase().includes(value) ||
            note.category.toLowerCase().includes(value)
    );

    renderNotes(filtered);
});

themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    saveTheme();
});

let draggedId = null;

// Track the dragged note id for drag-and-drop sorting
function handleDragStart(event) {
    draggedId = event.currentTarget.dataset.id;
    event.dataTransfer.effectAllowed = "move";
    event.currentTarget.classList.add("dragging");
}

// Show a visual drop target while dragging over a note card
function handleDragOver(event) {
    event.preventDefault();
    const target = event.currentTarget;
    if (target === event.target) {
        target.classList.add("drag-over");
    }
}

// Move the dragged note to the drop position in the notes array
function handleDrop(event) {
    event.preventDefault();
    const targetId = event.currentTarget.dataset.id;
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = notes.findIndex((note) => note.id === Number(draggedId));
    const targetIndex = notes.findIndex((note) => note.id === Number(targetId));

    const [draggedNote] = notes.splice(draggedIndex, 1);
    notes.splice(targetIndex, 0, draggedNote);
    renderNotes();
}

// Reset drag visual state after dragging ends
function handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging", "drag-over");
    draggedId = null;
}

saveTheme();
renderNotes();


