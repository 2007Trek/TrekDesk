import { recordService } from "./data.js";

const $ = id => document.getElementById(id);

let allRecords = [];
let editingId = null;

const elements = {
    total: $("total-count"),
    pending: $("pending-count"),
    progress: $("progress-count"),
    completed: $("completed-count"),
    recent: $("recent-records"),

    search: $("search-input"),
    filter: $("status-filter"),
    count: $("records-count"),
    recordsMessage: $("records-message"),
    table: $("records-table-body"),

    form: $("record-form"),
    heading: $("form-heading"),
    title: $("title"),
    category: $("category"),
    description: $("description"),
    status: $("status"),
    formMessage: $("form-message"),
    save: $("save-button"),
    cancel: $("cancel-edit-button"),

    details: $("record-details")
};

// Display messages safely.
function message(element, text, type = "info") {
    element.textContent = text;
    element.className = `message ${type}`;
}

// Create table cells.
function cell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
}

// Create buttons.
function button(text, action, id, danger = false) {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.textContent = text;
    btn.dataset.action = action;
    btn.dataset.id = id;

    btn.className = danger
        ? "button button-small button-danger"
        : "button button-small";

    return btn;
}

// Create status badges.
function badge(status) {
    const span = document.createElement("span");

    span.textContent = status;
    span.className = "status-badge";

    if (status === "Pending") {
        span.classList.add("status-pending");
    } else if (status === "In progress") {
        span.classList.add("status-progress");
    } else if (status === "Completed") {
        span.classList.add("status-completed");
    }

    return span;
}

// Dashboard statistics.
function renderStatistics() {
    elements.total.textContent = allRecords.length;

    elements.pending.textContent =
        allRecords.filter(r => r.status === "Pending").length;

    elements.progress.textContent =
        allRecords.filter(r => r.status === "In progress").length;

    elements.completed.textContent =
        allRecords.filter(r => r.status === "Completed").length;
}

// Recent requests.
function renderRecent() {
    elements.recent.replaceChildren();

    const recent = [...allRecords]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    if (!recent.length) {
        const row = document.createElement("tr");
        const td = cell("No support requests available.");
        td.colSpan = 5;
        row.appendChild(td);
        elements.recent.appendChild(row);
        return;
    }

    recent.forEach(record => {
        const row = document.createElement("tr");

        row.appendChild(cell(`#${record.id}`));
        row.appendChild(cell(record.title));
        row.appendChild(cell(record.category));

        const statusCell = document.createElement("td");
        statusCell.appendChild(badge(record.status));
        row.appendChild(statusCell);

        const actionCell = document.createElement("td");
        actionCell.appendChild(
            button("View", "view", record.id)
        );

        row.appendChild(actionCell);
        elements.recent.appendChild(row);
    });
}

// Search and filter.
function getFilteredRecords() {
    const search = elements.search.value.trim().toLowerCase();
    const status = elements.filter.value;

    return allRecords.filter(record => {
        const matchesTitle =
            record.title.toLowerCase().includes(search);

        const matchesStatus =
            status === "All" || record.status === status;

        return matchesTitle && matchesStatus;
    });
}

// Render all records.
function renderRecords() {
    elements.table.replaceChildren();

    const records = getFilteredRecords();

    elements.count.textContent =
        `${records.length} ${records.length === 1 ? "record" : "records"} displayed`;

    if (!records.length) {
        const row = document.createElement("tr");
        const td = cell(
            allRecords.length
                ? "No requests match your search or filter."
                : "No support requests have been recorded."
        );

        td.colSpan = 6;
        row.appendChild(td);
        elements.table.appendChild(row);
        return;
    }

    records.forEach(record => {
        const row = document.createElement("tr");

        row.appendChild(cell(`#${record.id}`));
        row.appendChild(cell(record.title));
        row.appendChild(cell(record.category));

        const statusCell = document.createElement("td");
        statusCell.appendChild(badge(record.status));
        row.appendChild(statusCell);

        row.appendChild(cell(record.description));

        const actions = document.createElement("td");
        actions.className = "table-actions";

        actions.appendChild(
            button("View", "view", record.id)
        );

        actions.appendChild(
            button("Edit", "edit", record.id)
        );

        actions.appendChild(
            button("Delete", "delete", record.id, true)
        );

        row.appendChild(actions);
        elements.table.appendChild(row);
    });
}

// Load data and refresh interface.
async function refreshRecords() {
    try {
        allRecords = await recordService.list();

        renderStatistics();
        renderRecent();
        renderRecords();

    } catch (error) {
        console.error(error);

        message(
            elements.recordsMessage,
            error.message || "Unable to load records.",
            "error"
        );
    }
}

// Validate form.
function validate(record) {
    if (record.title.length < 3 || record.title.length > 80) {
        return "Title must contain 3–80 characters.";
    }

    if (record.category.length < 2 || record.category.length > 40) {
        return "Category must contain 2–40 characters.";
    }

    if (
        record.description.length < 5 ||
        record.description.length > 300
    ) {
        return "Description must contain 5–300 characters.";
    }

    if (!["Pending", "In progress", "Completed"].includes(record.status)) {
        return "Select a valid status.";
    }

    return null;
}

// Reset form.
function resetForm() {
    editingId = null;

    elements.form.reset();

    elements.heading.textContent = "Create Support Request";
    elements.save.textContent = "Save Request";
    elements.cancel.hidden = true;
}

// Create or update.
elements.form.addEventListener("submit", async event => {
    event.preventDefault();

    const record = {
        title: elements.title.value.trim(),
        category: elements.category.value.trim(),
        description: elements.description.value.trim(),
        status: elements.status.value
    };

    const error = validate(record);

    if (error) {
        message(elements.formMessage, error, "error");
        return;
    }

    const updating = editingId !== null;

    elements.save.disabled = true;
    elements.save.textContent = updating ? "Updating..." : "Saving...";

    try {
        if (updating) {
            await recordService.update(editingId, record);
        } else {
            await recordService.create(record);
        }

        resetForm();

        await refreshRecords();

        message(
            elements.formMessage,
            updating
                ? "Support request updated successfully."
                : "Support request created successfully.",
            "success"
        );

        location.hash = "manage";

    } catch (error) {
        console.error(error);

        message(
            elements.formMessage,
            error.message || "Unable to save request.",
            "error"
        );

    } finally {
        elements.save.disabled = false;
        elements.save.textContent =
            editingId !== null ? "Save Changes" : "Save Request";
    }
});

// Edit a record.
async function editRecord(id) {
    try {
        const record = await recordService.get(id);

        editingId = record.id;

        elements.title.value = record.title;
        elements.category.value = record.category;
        elements.description.value = record.description;
        elements.status.value = record.status;

        elements.heading.textContent = "Edit Support Request";
        elements.save.textContent = "Save Changes";
        elements.cancel.hidden = false;

        message(
            elements.formMessage,
            `Editing support request #${record.id}.`,
            "info"
        );

        location.hash = "create";
        elements.title.focus();

    } catch (error) {
        message(elements.recordsMessage, error.message, "error");
    }
}

// View a record.
async function viewRecord(id) {
    try {
        const record = await recordService.get(id);

        const heading = document.createElement("h3");
        heading.textContent = `Support Request #${record.id}`;

        const grid = document.createElement("div");
        grid.className = "detail-grid";

        const fields = [
            ["Title", record.title],
            ["Category", record.category],
            ["Description", record.description]
        ];

        fields.forEach(([label, value]) => {
            const item = document.createElement("div");
            item.className = "detail-item";

            const strong = document.createElement("strong");
            strong.textContent = label;

            const paragraph = document.createElement("p");
            paragraph.textContent = value;

            item.append(strong, paragraph);
            grid.appendChild(item);
        });

        const statusItem = document.createElement("div");
        statusItem.className = "detail-item";

        const statusLabel = document.createElement("strong");
        statusLabel.textContent = "Status";

        const statusParagraph = document.createElement("p");
        statusParagraph.appendChild(badge(record.status));

        statusItem.append(statusLabel, statusParagraph);
        grid.appendChild(statusItem);

        const actions = document.createElement("div");
        actions.className = "detail-actions";

        actions.appendChild(
            button("Edit Request", "edit", record.id)
        );

        actions.appendChild(
            button("Delete Request", "delete", record.id, true)
        );

        elements.details.replaceChildren(heading, grid, actions);

        location.hash = "details";

    } catch (error) {
        message(elements.recordsMessage, error.message, "error");
    }
}

// Delete a record.
async function deleteRecord(id) {
    const record = allRecords.find(r => r.id === Number(id));

    if (!record) return;

    const confirmed = confirm(
        `Delete support request #${id}?\n\n${record.title}\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
        await recordService.remove(id);

        if (editingId === Number(id)) {
            resetForm();
        }

        elements.details.replaceChildren();

        await refreshRecords();

        message(
            elements.recordsMessage,
            `Support request #${id} deleted successfully.`,
            "success"
        );

        location.hash = "manage";

    } catch (error) {
        message(elements.recordsMessage, error.message, "error");
    }
}

// Handle table and detail buttons.
async function handleActions(event) {
    const btn = event.target.closest("button[data-action]");

    if (!btn) return;

    const { action, id } = btn.dataset;

    if (action === "view") {
        await viewRecord(id);
    }

    if (action === "edit") {
        await editRecord(id);
    }

    if (action === "delete") {
        await deleteRecord(id);
    }
}

elements.table.addEventListener("click", handleActions);
elements.recent.addEventListener("click", handleActions);
elements.details.addEventListener("click", handleActions);

// Search and filter events.
elements.search.addEventListener("input", renderRecords);
elements.filter.addEventListener("change", renderRecords);

// Cancel editing.
elements.cancel.addEventListener("click", () => {
    resetForm();

    message(
        elements.formMessage,
        "Editing cancelled.",
        "info"
    );
});

// Navigation highlighting.
function updateNavigation() {
    const hash = location.hash || "#home";

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.getAttribute("href") === hash
        );
    });
}

window.addEventListener("hashchange", updateNavigation);

// Start application.
async function initialise() {
    updateNavigation();
    await refreshRecords();

    console.log("TrekDesk successfully initialised.");
}

initialise();