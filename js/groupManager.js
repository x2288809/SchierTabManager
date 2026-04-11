import { state } from "./state.js";
import { DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME, getStoredGroups, saveStoredGroups, getAllTabs } from "./storage.js";
import { openDialog } from "./dialog.js";
import { t } from "./i18n.js";

export function getSelectedGroup() {
  if (state.selectedGroupId === DEFAULT_GROUP_ID) {
    return { id: DEFAULT_GROUP_ID, name: DEFAULT_GROUP_NAME, items: [] };
  }
  return state.groups.find((group) => group.id === state.selectedGroupId) || { id: DEFAULT_GROUP_ID, name: DEFAULT_GROUP_NAME, items: [] };
}

export async function initGroups() {
  state.groups = await getStoredGroups();
}

async function reorderGroups(sourceGroupId, targetGroupId) {
  if (sourceGroupId === targetGroupId) return;
  const sourceIndex = state.groups.findIndex((group) => group.id === sourceGroupId);
  const targetIndex = state.groups.findIndex((group) => group.id === targetGroupId);
  if (sourceIndex === -1 || targetIndex === -1) return;

  const [moved] = state.groups.splice(sourceIndex, 1);
  const insertIndex = targetIndex;
  state.groups.splice(insertIndex, 0, moved);

  await saveStoredGroups(state.groups);
}

export async function renderGroupList() {
  const groupList = document.getElementById("groupList");
  const tabs = await getAllTabs();
  const openCount = tabs.length;
  groupList.innerHTML = "";

  const openEntry = createGroupEntry(DEFAULT_GROUP_ID, t("defaultGroupName"), openCount, true);
  groupList.appendChild(openEntry);

  state.groups.forEach((group) => {
    const entry = createGroupEntry(group.id, group.name, group.items.length, false);
    groupList.appendChild(entry);
  });
}

function createGroupEntry(id, name, count, isDefault) {
  const entry = document.createElement("div");
  entry.className = "group-entry" + (state.selectedGroupId === id ? " selected" : "");
  entry.addEventListener("click", async () => {
    state.selectedGroupId = id;
    await renderGroupList();
    renderHeader();
    window.dispatchEvent(new CustomEvent("groupSelectionChanged"));
    hideGroupMenu();
  });

  const label = document.createElement("div");
  label.className = "group-label";
  label.innerHTML = `<div class="group-name">${name}</div><span class="group-count">${t("groupCount", { count })}</span>`;

  const controls = document.createElement("div");
  controls.className = "group-controls";

  if (!isDefault) {
    entry.draggable = true;
    entry.dataset.groupId = id;

    entry.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
      entry.classList.add("dragging");
    });

    entry.addEventListener("dragend", () => {
      entry.classList.remove("dragging");
    });

    entry.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      entry.classList.add("drag-over");
    });

    entry.addEventListener("dragleave", () => {
      entry.classList.remove("drag-over");
    });

    entry.addEventListener("drop", async (e) => {
      e.preventDefault();
      entry.classList.remove("drag-over");
      const sourceId = e.dataTransfer.getData("text/plain");
      if (!sourceId || sourceId === id) return;
      await reorderGroups(sourceId, id);
      await renderGroupList();
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.title = t("editGroup");
    editBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await editGroup(id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.title = t("deleteGroup");
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteGroup(id);
    });

    controls.append(editBtn, deleteBtn);
  }

  entry.append(label, controls);
  return entry;
}

export function renderHeader() {
  const titleEl = document.getElementById("groupTitle");
  const hintEl = document.getElementById("groupHint");
  const addSiteBtn = document.getElementById("addSiteBtn");
  const group = getSelectedGroup();

  titleEl.textContent = state.selectedGroupId === DEFAULT_GROUP_ID ? t("defaultGroupName") : group.name;

  if (state.selectedGroupId === DEFAULT_GROUP_ID) {
    hintEl.textContent = t("groupHintOpenTabs");
    addSiteBtn.classList.add("hidden");
  } else {
    hintEl.textContent = t("groupHintGroupContent");
    addSiteBtn.classList.remove("hidden");
  }
}

export async function addGroup() {
  const values = await openDialog({
    title: t("newGroup"),
    fields: [
      { name: "name", label: t("groupName"), placeholder: t("enterGroupName"), value: "" }
    ],
    confirmText: t("create")
  });

  if (!values || !values.name) return;

  const newGroup = {
    id: Date.now().toString(),
    name: values.name,
    items: []
  };

  state.groups.push(newGroup);
  await saveStoredGroups(state.groups);
  state.selectedGroupId = newGroup.id;
}

export async function editGroup(id) {
  const group = state.groups.find((item) => item.id === id);
  if (!group) return;

  const values = await openDialog({
    title: t("editGroup"),
    fields: [
      { name: "name", label: t("groupName"), placeholder: t("enterGroupName"), value: group.name }
    ],
    confirmText: t("save")
  });

  if (!values || !values.name) return;

  group.name = values.name;
  await saveStoredGroups(state.groups);
}

export async function deleteGroup(id) {
  if (!confirm(t("confirmDeleteGroup"))) return;

  state.groups = state.groups.filter((group) => group.id !== id);
  await saveStoredGroups(state.groups);

  if (state.selectedGroupId === id) {
    state.selectedGroupId = DEFAULT_GROUP_ID;
  }
}

export async function addSiteToCurrentGroup() {
  if (state.selectedGroupId === DEFAULT_GROUP_ID) return;
  const group = getSelectedGroup();
  if (!group) return;

  const values = await openDialog({
    title: t("addWebsiteToGroup"),
    fields: [
      { name: "title", label: t("websiteName"), placeholder: t("enterWebsiteName"), value: "" },
      { name: "url", label: t("websiteUrl"), placeholder: t("enterWebsiteUrl"), value: "" }
    ],
    confirmText: t("add")
  });

  if (!values || !values.url) return;

  let url = values.url;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const item = {
    id: Date.now().toString(),
    title: values.title || url,
    url,
    favIconUrl: "assets/icons/16.png"
  };

  group.items.unshift(item);
  await saveStoredGroups(state.groups);
}

export async function editGroupItem(itemId) {
  const group = getSelectedGroup();
  const item = group.items.find((saved) => saved.id === itemId);
  if (!item) return;

  const values = await openDialog({
    title: t("editUrlBtnTitle"),
    fields: [
      { name: "title", label: t("websiteName"), placeholder: t("enterWebsiteName"), value: item.title },
      { name: "url", label: t("websiteUrl"), placeholder: t("enterWebsiteUrl"), value: item.url }
    ],
    confirmText: t("save")
  });

  if (!values || !values.title || !values.url) return;

  let url = values.url;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  item.title = values.title.trim();
  item.url = url;
  await saveStoredGroups(state.groups);
}

export async function deleteGroupItem(itemId) {
  const group = getSelectedGroup();
  group.items = group.items.filter((item) => item.id !== itemId);
  await saveStoredGroups(state.groups);
}

export async function exportGroups() {
  const json = JSON.stringify(state.groups, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "SchierTabGroups.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importGroups(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data) || !data.every((group) => {
      return typeof group.id === "string" && typeof group.name === "string" && Array.isArray(group.items);
    })) {
      throw new Error("invalid format");
    }

    if (!confirm(t("importConfirm"))) {
      return;
    }

    state.groups = data;
    state.selectedGroupId = DEFAULT_GROUP_ID;
    await saveStoredGroups(state.groups);
    alert(t("importSuccess"));
  } catch (error) {
    alert(t("importFail"));
  }
}

export function hideGroupMenu() {
  const groupMenuEl = document.getElementById("groupMenu");
  if (!groupMenuEl) return;
  groupMenuEl.classList.add("hidden");
  groupMenuEl.innerHTML = "";
}
