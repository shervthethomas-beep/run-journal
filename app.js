// ---- Storage helpers ----
// All entries are saved in the browser's localStorage as a JSON string,
// under this one key. That means your data stays on this device only.
const STORAGE_KEY = "runJournalEntries";

function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ---- Element references ----
const listView = document.getElementById("list-view");
const formView = document.getElementById("form-view");
const entriesList = document.getElementById("entries-list");
const emptyMessage = document.getElementById("empty-message");
const entryForm = document.getElementById("entry-form");
const dateInput = document.getElementById("entry-date");
const distanceInput = document.getElementById("entry-distance");
const notesInput = document.getElementById("entry-notes");
const newEntryBtn = document.getElementById("new-entry-btn");
const cancelBtn = document.getElementById("cancel-btn");
const deleteBtn = document.getElementById("delete-btn");

// Tracks which entry is currently open for editing (null = adding a new one)
let editingId = null;

// ---- View switching ----
function showListView() {
  formView.hidden = true;
  listView.hidden = false;
  renderEntries();
}

function showFormView() {
  listView.hidden = true;
  formView.hidden = false;
}

// ---- Rendering the list of past entries ----
function renderEntries() {
  const entries = loadEntries();

  // Newest first, sorted by date
  entries.sort((a, b) => b.date.localeCompare(a.date));

  entriesList.innerHTML = "";

  if (entries.length === 0) {
    emptyMessage.hidden = false;
    return;
  }
  emptyMessage.hidden = true;

  for (const entry of entries) {
    const card = document.createElement("div");
    card.className = "entry-card";
    card.dataset.id = entry.id;

    const top = document.createElement("div");
    top.className = "entry-card-top";

    const dateSpan = document.createElement("span");
    dateSpan.className = "entry-card-date";
    dateSpan.textContent = formatDate(entry.date);

    const distanceSpan = document.createElement("span");
    distanceSpan.className = "entry-card-distance";
    distanceSpan.textContent = `${entry.distance} mi`;

    top.appendChild(dateSpan);
    top.appendChild(distanceSpan);
    card.appendChild(top);

    if (entry.notes) {
      const notesDiv = document.createElement("div");
      notesDiv.className = "entry-card-notes";
      notesDiv.textContent = entry.notes;
      card.appendChild(notesDiv);
    }

    card.addEventListener("click", () => openEntry(entry.id));
    entriesList.appendChild(card);
  }
}

function formatDate(isoDate) {
  // isoDate is "YYYY-MM-DD"; show it in a friendlier format
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---- Opening the form for a new or existing entry ----
function openNewEntry() {
  editingId = null;
  entryForm.reset();
  dateInput.value = todayAsISODate();
  deleteBtn.hidden = true;
  showFormView();
}

function openEntry(id) {
  const entries = loadEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;

  editingId = id;
  dateInput.value = entry.date;
  distanceInput.value = entry.distance;
  notesInput.value = entry.notes;
  deleteBtn.hidden = false;
  showFormView();
}

function todayAsISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

// ---- Saving and deleting ----
function handleSubmit(event) {
  event.preventDefault();

  const entries = loadEntries();

  if (editingId) {
    const entry = entries.find((e) => e.id === editingId);
    entry.date = dateInput.value;
    entry.distance = distanceInput.value;
    entry.notes = notesInput.value;
  } else {
    entries.push({
      id: crypto.randomUUID(),
      date: dateInput.value,
      distance: distanceInput.value,
      notes: notesInput.value,
    });
  }

  saveEntries(entries);
  showListView();
}

function handleDelete() {
  if (!editingId) return;
  if (!confirm("Delete this entry? This can't be undone.")) return;

  const entries = loadEntries().filter((e) => e.id !== editingId);
  saveEntries(entries);
  showListView();
}

// ---- Wire up events ----
newEntryBtn.addEventListener("click", openNewEntry);
cancelBtn.addEventListener("click", showListView);
deleteBtn.addEventListener("click", handleDelete);
entryForm.addEventListener("submit", handleSubmit);

// ---- Initial render ----
renderEntries();
