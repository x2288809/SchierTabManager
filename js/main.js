import { state } from "./state.js";
import { initGroups, renderGroupList, renderHeader, addGroup, addSiteToCurrentGroup, exportGroups, importGroups } from "./groupManager.js";
import { attachDialogEvents } from "./dialog.js";
import { renderTabs, closeDuplicateTabs } from "./tabs.js";
import { initLanguage, applyLocale, toggleLanguage } from "./i18n.js";

const searchEngineMap = {
  baidu: "https://www.baidu.com/s?wd=",
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q="
};

function getSearchUrl(keyword, engine) {
  const query = keyword.trim();
  if (!query) return null;
  return `${searchEngineMap[engine] || searchEngineMap.baidu}${encodeURIComponent(query)}`;
}

function getSavedSearchEngine() {
  const stored = localStorage.getItem("searchEngine");
  return stored && searchEngineMap[stored] ? stored : "baidu";
}

function saveSearchEngine(engine) {
  if (searchEngineMap[engine]) {
    localStorage.setItem("searchEngine", engine);
  }
}

function performWebSearch() {
  const input = document.getElementById("webSearchInput");
  const engine = document.getElementById("searchEngine").value;
  const url = getSearchUrl(input.value, engine);
  if (!url) return;
  chrome.tabs.create({ url });
}

function attachEvents() {
  const searchEngineSelect = document.getElementById("searchEngine");
  if (searchEngineSelect) {
    searchEngineSelect.addEventListener("change", (e) => {
      saveSearchEngine(e.target.value);
    });
  }

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

  document.getElementById("newBlankTab").addEventListener("click", async () => {
    await chrome.tabs.create({ url: "edge://newtab/" });
    await renderTabs(state.currentSearch);
  });

  document.getElementById("search").addEventListener("input", async (e) => {
    state.currentSearch = e.target.value;
    await renderTabs(state.currentSearch);
  });

  document.getElementById("webSearchButton").addEventListener("click", () => {
    performWebSearch();
  });

  document.getElementById("webSearchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      performWebSearch();
    }
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

  document.getElementById("closeDuplicate").addEventListener("click", async () => {
    await closeDuplicateTabs();
    await renderGroupList();
    await renderTabs(state.currentSearch);
  });

  const languageToggleBtn = document.getElementById("languageToggle");
  if (languageToggleBtn) {
    languageToggleBtn.addEventListener("click", async () => {
      await toggleLanguage();
      await applyLocale();
      await renderGroupList();
      renderHeader();
      await renderTabs(state.currentSearch);
    });
  }

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
  await initLanguage();
  await applyLocale();
  await initGroups();
  await renderGroupList();
  renderHeader();
  attachDialogEvents();
  attachEvents();

  const searchEngineSelect = document.getElementById("searchEngine");
  if (searchEngineSelect) {
    searchEngineSelect.value = getSavedSearchEngine();
  }

  await renderTabs();
}

document.addEventListener("DOMContentLoaded", init);
