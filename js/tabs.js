import { state } from "./state.js";
import { DEFAULT_GROUP_ID, defaultIcon, formatUrl, getAllTabs, saveStoredGroups } from "./storage.js";
import { getSelectedGroup, editGroupItem, deleteGroupItem, hideGroupMenu } from "./groupManager.js";
import { t } from "./i18n.js";

const groupMenuEl = document.getElementById("groupMenu");

async function reorderGroupItems(sourceItemId, targetItemId) {
  const group = getSelectedGroup();
  if (!group || !Array.isArray(group.items)) return;

  const sourceIndex = group.items.findIndex((item) => item.id === sourceItemId);
  const targetIndex = group.items.findIndex((item) => item.id === targetItemId);
  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

  const [moved] = group.items.splice(sourceIndex, 1);
  const insertIndex = targetIndex;
  group.items.splice(insertIndex, 0, moved);
  await saveStoredGroups(state.groups);
}

export async function renderTabs(keyword = "") {
  const tabList = document.getElementById("tabList");
  tabList.innerHTML = "";
  const lowerKey = keyword.toLowerCase();

  if (state.selectedGroupId === DEFAULT_GROUP_ID) {
    const tabs = await getAllTabs();
    const filtered = tabs.filter((tab) => {
      const title = (tab.title || "").toLowerCase();
      const url = (tab.url || "").toLowerCase();
      return title.includes(lowerKey) || url.includes(lowerKey);
    });

    if (!filtered.length) {
      tabList.innerHTML = `<div class="no-data">${t("noMatchedTabs")}</div>`;
      return;
    }

    filtered.forEach((tab) => {
      const item = document.createElement("div");
      item.className = "tab-item";

      const meta = document.createElement("div");
      meta.className = "tab-meta";

      const fav = document.createElement("img");
      fav.className = "tab-fav";
      fav.src = tab.favIconUrl || defaultIcon;
      fav.onerror = () => (fav.src = defaultIcon);

      const info = document.createElement("div");
      info.className = "tab-info";
      info.innerHTML = `<div class="tab-title">${tab.title || tab.url}</div><div class="tab-url">${formatUrl(tab.url)}</div>`;

      meta.append(fav, info);

      const action = document.createElement("div");
      action.className = "item-actions";

      const addBtn = document.createElement("button");
      addBtn.className = "icon-button add-to-group";
      addBtn.textContent = "+";
      addBtn.title = t("addToGroupBtnTitle");
      addBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        showAddToGroupMenu(e.pageX, e.pageY, tab);
      });

      const closeBtn = document.createElement("button");
      closeBtn.className = "icon-button";
      closeBtn.textContent = "×";
      closeBtn.title = t("closeTabBtnTitle");
      closeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await chrome.tabs.remove(tab.id);
        window.dispatchEvent(new CustomEvent("tabListChanged"));
      });

      action.append(addBtn, closeBtn);

      item.addEventListener("click", (e) => {
        if (e.target === closeBtn || e.target === addBtn) return;
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
        window.close();
      });

      item.append(meta, action);
      tabList.appendChild(item);
    });
  } else {
    const group = getSelectedGroup();
    const filtered = group.items.filter((item) => {
      return item.title.toLowerCase().includes(lowerKey) || item.url.toLowerCase().includes(lowerKey);
    });

    if (!filtered.length) {
      tabList.innerHTML = `<div class="no-data">${t("noMatchedGroupTabs")}</div>`;
      return;
    }

    filtered.forEach((itemData) => {
      const item = document.createElement("div");
      item.className = "tab-item";
      item.draggable = true;
      item.dataset.itemId = itemData.id;

      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", itemData.id);
        e.dataTransfer.effectAllowed = "move";
        item.classList.add("dragging");
      });

      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
      });

      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        item.classList.add("drag-over");
      });

      item.addEventListener("dragleave", () => {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", async (e) => {
        e.preventDefault();
        item.classList.remove("drag-over");
        const sourceId = e.dataTransfer.getData("text/plain");
        if (!sourceId || sourceId === itemData.id) return;
        await reorderGroupItems(sourceId, itemData.id);
        await renderTabs(keyword);
      });

      const meta = document.createElement("div");
      meta.className = "tab-meta";

      const fav = document.createElement("img");
      fav.className = "tab-fav";
      fav.src = itemData.favIconUrl || defaultIcon;
      fav.onerror = () => (fav.src = defaultIcon);

      const info = document.createElement("div");
      info.className = "tab-info";
      info.innerHTML = `<div class="tab-title">${itemData.title}</div><div class="tab-url">${formatUrl(itemData.url)}</div>`;

      meta.append(fav, info);

      const action = document.createElement("div");
      action.className = "item-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "icon-button";
      editBtn.textContent = "✎";
      editBtn.title = t("editUrlBtnTitle");
      editBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await editGroupItem(itemData.id);
        window.dispatchEvent(new CustomEvent("tabListChanged"));
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "icon-button";
      deleteBtn.textContent = "🗑";
      deleteBtn.title = t("deleteUrlBtnTitle");
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deleteGroupItem(itemData.id);
        window.dispatchEvent(new CustomEvent("groupChanged"));
      });

      action.append(editBtn, deleteBtn);

      item.addEventListener("click", () => {
        chrome.tabs.create({ url: itemData.url });
        window.close();
      });

      item.append(meta, action);
      tabList.appendChild(item);
    });
  }
}

export async function addGroupItem(groupId, tab) {
  const target = state.groups.find((group) => group.id === groupId);
  if (!target) return;

  if (target.items.some((item) => item.url === tab.url)) {
    alert(t("urlExistsInGroup"));
    return;
  }

  target.items.unshift({
    id: Date.now().toString(),
    title: tab.title || tab.url,
    url: tab.url,
    favIconUrl: tab.favIconUrl || defaultIcon
  });

  await saveStoredGroups(state.groups);
  alert(t("addedToGroup", { name: target.name }));
}

function getMenuBounds() {
  const rect = groupMenuEl.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

export function showAddToGroupMenu(x, y, tab) {
  groupMenuEl.innerHTML = "";
  groupMenuEl.classList.remove("hidden");

  const header = document.createElement("div");
  header.className = "group-menu-header";
  header.textContent = t("addToGroupTitle");
  groupMenuEl.appendChild(header);

  if (!state.groups.length) {
    const empty = document.createElement("div");
    empty.className = "group-menu-item";
    empty.textContent = t("noGroupHint");
    groupMenuEl.appendChild(empty);
  } else {
    state.groups.forEach((group) => {
      const item = document.createElement("div");
      item.className = "group-menu-item";
      item.innerHTML = `<span>${group.name}</span><span class="menu-item-count">${t("groupMenuCount", { count: group.items.length })}</span>`;
      item.addEventListener("click", async () => {
        await addGroupItem(group.id, tab);
        hideGroupMenu();
        window.dispatchEvent(new CustomEvent("groupChanged"));
      });
      groupMenuEl.appendChild(item);
    });
  }

  const { width, height } = getMenuBounds();
  let left = x;
  let top = y;
  if (left + width > window.innerWidth - 12) {
    left = Math.max(window.innerWidth - width - 12, 12);
  }
  if (top + height > window.innerHeight - 12) {
    top = Math.max(window.innerHeight - height - 12, 12);
  }

  groupMenuEl.style.left = `${left}px`;
  groupMenuEl.style.top = `${top}px`;
}

export async function closeDuplicateTabs() {
  const tabs = await chrome.tabs.query({});
  const seen = new Set();
  const toRemove = [];
  tabs.forEach((tab) => {
    if (seen.has(tab.url)) {
      toRemove.push(tab.id);
    } else {
      seen.add(tab.url);
    }
  });
  if (toRemove.length) {
    await chrome.tabs.remove(toRemove);
  }
}
