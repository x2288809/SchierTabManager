// background.js
const managerTabIds = new Set();
const managerUrl = chrome.runtime.getURL("manager.html");

// 点击插件图标  打开新标签页形式的管理器
chrome.action.onClicked.addListener(() => {
  toggleManagerPage();
});

async function toggleManagerPage() {
  const tabs = await chrome.tabs.query({ url: managerUrl });
  if (tabs.length) {
    // 存在则关闭所有管理页
    const ids = tabs.map(tab => tab.id).filter(Boolean);
    await chrome.tabs.remove(ids);
    ids.forEach(id => managerTabIds.delete(id));
  } else {
    // 不存在则打开
    const tab = await chrome.tabs.create({ url: managerUrl, active: true });
    if (tab && tab.id) {
      managerTabIds.add(tab.id);
    }
  }
}

async function openManagerPage() {
  const tabs = await chrome.tabs.query({ url: managerUrl });
  if (tabs.length) {
    const tab = tabs[0];
    managerTabIds.add(tab.id);
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tab.id, { active: true });
  } else {
    const tab = await chrome.tabs.create({ url: managerUrl, active: true });
    if (tab && tab.id) {
      managerTabIds.add(tab.id);
    }
  }
}

// 快捷键监听修改为调用 toggleManagerPage
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-manager") {
    toggleManagerPage();
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const activeTab = await chrome.tabs.get(activeInfo.tabId);
  if (isManagerTab(activeTab)) return;

  const managerTabs = await chrome.tabs.query({ url: chrome.runtime.getURL("manager.html") });
  const ids = managerTabs.map((tab) => tab.id).filter(Boolean);
  if (ids.length) {
    await chrome.tabs.remove(ids);
  }
});

function isManagerTab(tab) {
  if (!tab) return false;
  return tab.id && managerTabIds.has(tab.id) || tab.url === managerUrl || tab.pendingUrl === managerUrl;
}

chrome.tabs.onRemoved.addListener((tabId) => {
  managerTabIds.delete(tabId);
});

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url === managerUrl || tab.pendingUrl === managerUrl) {
    managerTabIds.add(tab.id);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url === managerUrl || tab.pendingUrl === managerUrl) {
    managerTabIds.add(tabId);
  }
});

// 安装初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log("uTabManager 已启动");
});