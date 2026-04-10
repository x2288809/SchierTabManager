export const DEFAULT_GROUP_ID = "open-tabs";
export const DEFAULT_GROUP_NAME = "已打开标签";
export const defaultIcon = "assets/icons/16.png";

export async function getStoredGroups() {
  const data = await chrome.storage.local.get("tabGroups");
  return data.tabGroups || [];
}

export async function saveStoredGroups(groups) {
  await chrome.storage.local.set({ tabGroups: groups });
  return groups;
}

export async function getAllTabs() {
  return await chrome.tabs.query({});
}

export function formatUrl(url) {
  if (!url) return "";
  return url.length > 60 ? `${url.slice(0, 60)}...` : url;
}
