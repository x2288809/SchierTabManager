import { state } from "./state.js";
import { initGroups, renderGroupList, renderHeader, addGroup, addSiteToCurrentGroup, exportGroups, importGroups } from "./groupManager.js";
import { attachDialogEvents } from "./dialog.js";
import { renderTabs, closeOtherTabs, closeDuplicateTabs } from "./tabs.js";

function attachEvents() {
  document.getElementById("addGroupBtn").addEventListener("click", async () => {
    await addGroup();
    await renderGroupList();
    renderHeader();
    await renderTabs(state.currentSearch);
  });

  document.getElementById("addSiteBtn").addEventListener("click", async () => {
    await addSiteToCurrentGroup();
    await renderGroupList();
    await renderTabs(state.currentSearch);
  });

  document.getElementById("search").addEventListener("input", async (e) => {
    state.currentSearch = e.target.value;
    await renderTabs(state.currentSearch);
  });

  document.getElementById("refresh").addEventListener("click", () => renderTabs(state.currentSearch));
  document.getElementById("exportGroups").addEventListener("click", exportGroups);

  const importInput = document.getElementById("importFileInput");
  document.getElementById("importGroups").addEventListener("click", () => {
    if (importInput) {
      importInput.click();
    }
  });

  if (importInput) {
    importInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await importGroups(file);
      e.target.value = "";
      await renderGroupList();
      renderHeader();
      await renderTabs(state.currentSearch);
    });
  }

  document.getElementById("closeOthers").addEventListener("click", async () => {
    await closeOtherTabs();
    await renderGroupList();
    await renderTabs(state.currentSearch);
  });

  document.getElementById("closeDuplicate").addEventListener("click", async () => {
    await closeDuplicateTabs();
    await renderGroupList();
    await renderTabs(state.currentSearch);
  });

  window.addEventListener("click", (e) => {
    const groupMenuEl = document.getElementById("groupMenu");
    if (!groupMenuEl.contains(e.target)) {
      groupMenuEl.classList.add("hidden");
    }
  });

  window.addEventListener("tabListChanged", async () => {
    await renderGroupList();
    await renderTabs(state.currentSearch);
  });

  window.addEventListener("groupChanged", async () => {
    await renderGroupList();
    await renderTabs(state.currentSearch);
  });

  window.addEventListener("groupSelectionChanged", async () => {
    await renderTabs(state.currentSearch);
  });
}

async function init() {
  await initGroups();
  await renderGroupList();
  renderHeader();
  attachDialogEvents();
  attachEvents();
  await renderTabs();
}

document.addEventListener("DOMContentLoaded", init);
