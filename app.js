// ---- Supabase setup ----
const isConfigured =
  typeof SUPABASE_URL !== "undefined" &&
  typeof SUPABASE_ANON_KEY !== "undefined" &&
  !SUPABASE_URL.includes("YOUR-PROJECT-ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR-ANON-PUBLIC-KEY");

const supabaseClient = isConfigured
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ---- Department colors (used for little dots/chips on the calendar) ----
const DEPARTMENT_COLORS = {
  "F&B Training": "#e07a5f",
  "FO Training": "#3d5a80",
  "HK Training": "#81b29a",
  "General Training": "#f2cc8f",
  Admin: "#9b5de5",
};

function colorForDepartment(department) {
  return DEPARTMENT_COLORS[department] || "#888";
}

// ---- Element references ----
const configWarning = document.getElementById("config-warning");
const loadingMessage = document.getElementById("loading-message");
const monthLabel = document.getElementById("month-label");
const calendarGrid = document.getElementById("calendar-grid");
const prevMonthBtn = document.getElementById("prev-month-btn");
const nextMonthBtn = document.getElementById("next-month-btn");
const todayBtn = document.getElementById("today-btn");
const addEntryFab = document.getElementById("add-entry-fab");

const entryModal = document.getElementById("entry-modal");
const entryForm = document.getElementById("entry-form");
const entryDateInput = document.getElementById("entry-date");
const entryNameInput = document.getElementById("entry-name");
const entryDepartmentInput = document.getElementById("entry-department");
const entryActivityInput = document.getElementById("entry-activity");
const entryFormError = document.getElementById("entry-form-error");
const cancelEntryBtn = document.getElementById("cancel-entry-btn");

const dayModal = document.getElementById("day-modal");
const dayModalTitle = document.getElementById("day-modal-title");
const dayModalList = document.getElementById("day-modal-list");
const addForDayBtn = document.getElementById("add-for-day-btn");
const closeDayModalBtn = document.getElementById("close-day-modal-btn");

// ---- State ----
let allEntries = []; // flat list of all entries from Supabase
let currentMonth = startOfMonth(new Date());
let dayModalDate = null; // ISO date string currently shown in the day modal

// ---- Date helpers ----
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toISODate(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function todayISODate() {
  return toISODate(new Date());
}

function formatDateHuman(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---- Loading entries from Supabase ----
async function loadEntries() {
  if (!supabaseClient) {
    loadingMessage.hidden = true;
    renderCalendar();
    return;
  }

  loadingMessage.hidden = false;
  const { data, error } = await supabaseClient
    .from("entries")
    .select("*")
    .order("entry_date", { ascending: true });

  loadingMessage.hidden = true;

  if (error) {
    console.error("Failed to load entries:", error);
    loadingMessage.hidden = false;
    loadingMessage.textContent = "Couldn't load entries. Check your Supabase setup in config.js.";
    return;
  }

  allEntries = data;
  renderCalendar();
  if (dayModalDate) renderDayModal(dayModalDate);
}

function subscribeToRealtimeUpdates() {
  if (!supabaseClient) return;

  supabaseClient
    .channel("entries-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "entries" },
      () => {
        loadEntries();
      }
    )
    .subscribe();
}

// ---- Grouping entries by date ----
function entriesForDate(isoDate) {
  return allEntries.filter((e) => e.entry_date === isoDate);
}

// ---- Rendering the calendar ----
function renderCalendar() {
  monthLabel.textContent = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  calendarGrid.innerHTML = "";

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayISODate();

  // Leading blank cells so day 1 lines up under the right weekday
  for (let i = 0; i < firstWeekday; i++) {
    const blank = document.createElement("div");
    blank.className = "calendar-cell calendar-cell-blank";
    calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isoDate = toISODate(new Date(year, month, day));
    const dayEntries = entriesForDate(isoDate);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    if (isoDate === today) cell.classList.add("calendar-cell-today");
    if (dayEntries.length > 0) cell.classList.add("calendar-cell-has-entries");

    const dayNumber = document.createElement("span");
    dayNumber.className = "calendar-day-number";
    dayNumber.textContent = day;
    cell.appendChild(dayNumber);

    if (dayEntries.length > 0) {
      const chips = document.createElement("div");
      chips.className = "calendar-day-chips";

      const visible = dayEntries.slice(0, 3);
      for (const entry of visible) {
        const dot = document.createElement("span");
        dot.className = "chip-dot";
        dot.style.backgroundColor = colorForDepartment(entry.department);
        dot.title = `${entry.name} — ${entry.department}`;
        chips.appendChild(dot);
      }
      if (dayEntries.length > 3) {
        const more = document.createElement("span");
        more.className = "chip-more";
        more.textContent = `+${dayEntries.length - 3}`;
        chips.appendChild(more);
      }
      cell.appendChild(chips);

      const countBadge = document.createElement("span");
      countBadge.className = "calendar-day-count";
      countBadge.textContent = dayEntries.length;
      cell.appendChild(countBadge);
    }

    cell.addEventListener("click", () => openDayModal(isoDate));
    calendarGrid.appendChild(cell);
  }
}

// ---- Day details modal ----
function openDayModal(isoDate) {
  dayModalDate = isoDate;
  renderDayModal(isoDate);
  dayModal.showModal();
}

function renderDayModal(isoDate) {
  dayModalTitle.textContent = formatDateHuman(isoDate);
  const dayEntries = entriesForDate(isoDate);

  dayModalList.innerHTML = "";

  if (dayEntries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "Nothing logged for this day yet.";
    dayModalList.appendChild(empty);
    return;
  }

  for (const entry of dayEntries) {
    const item = document.createElement("div");
    item.className = "day-entry-item";

    const header = document.createElement("div");
    header.className = "day-entry-header";

    const dot = document.createElement("span");
    dot.className = "chip-dot";
    dot.style.backgroundColor = colorForDepartment(entry.department);
    header.appendChild(dot);

    const name = document.createElement("span");
    name.className = "day-entry-name";
    name.textContent = entry.name;
    header.appendChild(name);

    const department = document.createElement("span");
    department.className = "day-entry-department";
    department.textContent = entry.department;
    header.appendChild(department);

    item.appendChild(header);

    const activity = document.createElement("p");
    activity.className = "day-entry-activity";
    activity.textContent = entry.activity;
    item.appendChild(activity);

    dayModalList.appendChild(item);
  }
}

// ---- Add entry modal ----
function openEntryModal(prefillDate) {
  entryForm.reset();
  entryFormError.hidden = true;
  entryDateInput.value = prefillDate || todayISODate();
  entryModal.showModal();
}

async function handleEntrySubmit(event) {
  event.preventDefault();

  if (!supabaseClient) {
    entryFormError.textContent =
      "Supabase isn't configured yet — see the README to set up config.js.";
    entryFormError.hidden = false;
    return;
  }

  const saveBtn = document.getElementById("save-entry-btn");
  saveBtn.disabled = true;

  const newEntry = {
    entry_date: entryDateInput.value,
    name: entryNameInput.value,
    department: entryDepartmentInput.value,
    activity: entryActivityInput.value.trim(),
  };

  const { error } = await supabaseClient.from("entries").insert(newEntry);

  saveBtn.disabled = false;

  if (error) {
    console.error("Failed to save entry:", error);
    entryFormError.textContent = "Couldn't save this entry. Please try again.";
    entryFormError.hidden = false;
    return;
  }

  entryModal.close();
  await loadEntries();
}

// ---- Wire up events ----
prevMonthBtn.addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  renderCalendar();
});

todayBtn.addEventListener("click", () => {
  currentMonth = startOfMonth(new Date());
  renderCalendar();
});

addEntryFab.addEventListener("click", () => openEntryModal());
cancelEntryBtn.addEventListener("click", () => entryModal.close());
entryForm.addEventListener("submit", handleEntrySubmit);

addForDayBtn.addEventListener("click", () => {
  dayModal.close();
  openEntryModal(dayModalDate);
});
closeDayModalBtn.addEventListener("click", () => dayModal.close());

// Clicking the backdrop of a <dialog> closes it
for (const dialog of [entryModal, dayModal]) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

// ---- Init ----
if (!isConfigured) {
  configWarning.hidden = false;
}

loadEntries();
subscribeToRealtimeUpdates();
