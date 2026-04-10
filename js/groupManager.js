import { state } from "./state.js";
import { DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME, getStoredGroups, saveStoredGroups, getAllTabs } from "./storage.js";
import { openDialog } from "./dialog.js";

export function getSelectedGroup() {
  if (state.selectedGroupId === DEFAULT_GROUP_ID) {
    return { id: DEFAULT_GROUP_ID, name: DEFAULT_GROUP_NAME, items: [] };
  }
  return state.groups.find((group) => group.id === state.selectedGroupId) || { id: DEFAULT_GROUP_ID, name: DEFAULT_GROUP_NAME, items: [] };
}

export async function initGroups() {
  state.groups = await getStoredGroups();
}

export async function renderGroupList() {
  const groupList = document.getElementById("groupList");
  const tabs = await getAllTabs();
  const openCount = tabs.length;
  groupList.innerHTML = "";

  const openEntry = createGroupEntry(DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME, openCount, true);
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
  label.innerHTML = `<div class="group-name">${name}</div><span class="group-count">${count} 项</span>`;

  const controls = document.createElement("div");
  controls.className = "group-controls";

  if (!isDefault) {
    const editBtn = document.createElement("button");
    editBtn.textContent = "✎";
    editBtn.title = "编辑分组";
    editBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await editGroup(id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.title = "删除分组";
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

  titleEl.textContent = group.name;

  if (state.selectedGroupId === DEFAULT_GROUP_ID) {
    hintEl.textContent = "悬停标签可显示快捷操作，点击 + 添加到分组。";
    addSiteBtn.classList.add("hidden");
  } else {
    hintEl.textContent = "当前为分组内容，可编辑、删除网站，或手动新增网址。";
    addSiteBtn.classList.remove("hidden");
  }
}

export async function addGroup() {
  const values = await openDialog({
    title: "新增分组",
    fields: [
      { name: "name", label: "分组名称", placeholder: "请输入分组名称", value: "" }
    ],
    confirmText: "创建"
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
    title: "编辑分组",
    fields: [
      { name: "name", label: "分组名称", placeholder: "请输入分组名称", value: group.name }
    ],
    confirmText: "保存"
  });

  if (!values || !values.name) return;

  group.name = values.name;
  await saveStoredGroups(state.groups);
}

export async function deleteGroup(id) {
  if (!confirm("确认删除此分组？此操作无法撤销。")) return;

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
    title: "新增网站到分组",
    fields: [
      { name: "title", label: "网站名称", placeholder: "请输入网站名称", value: "" },
      { name: "url", label: "网站地址", placeholder: "请输入完整网址，例如 https://example.com", value: "" }
    ],
    confirmText: "添加"
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
    title: "编辑网站",
    fields: [
      { name: "title", label: "网站名称", placeholder: "请输入网站名称", value: item.title },
      { name: "url", label: "网站地址", placeholder: "请输入完整网址，例如 https://example.com", value: item.url }
    ],
    confirmText: "保存"
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

    if (!confirm("导入将覆盖当前本地分组数据，是否继续？")) {
      return;
    }

    state.groups = data;
    state.selectedGroupId = DEFAULT_GROUP_ID;
    await saveStoredGroups(state.groups);
    alert("分组数据已导入。");
  } catch (error) {
    alert("导入失败：文件格式不正确。");
  }
}

export function hideGroupMenu() {
  const groupMenuEl = document.getElementById("groupMenu");
  if (!groupMenuEl) return;
  groupMenuEl.classList.add("hidden");
  groupMenuEl.innerHTML = "";
}
