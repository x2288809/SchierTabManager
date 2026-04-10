const translations = {
  zh: {
    title: "标签管理器 - SchierTabManager",
    appTitle: "🏷️ SchierTabManager 标签管理器",
    shortcutNote: "快捷打开/关闭管理页：默认 Ctrl+Q，可在浏览器扩展快捷键设置中自定义。",
    groupManagement: "分组管理",
    groupManagementHint: "管理你的标签分组",
    addGroup: "+ 新增分组",
    openTabs: "已打开标签",
    groupHintOpenTabs: "悬停标签可显示快捷操作，点击 + 添加到分组。",
    groupHintGroupContent: "当前为分组内容，可编辑、删除网站，或手动新增网址。",
    addSite: " 新增网站",
    searchPlaceholder: "搜索标签标题或网址...",
    closeDuplicate: "去重标签",
    refresh: "刷新列表",
    importData: "导入数据",
    exportData: "导出数据",
    switchToEnglish: "English",
    switchToChinese: "中文",
    dialogTitle: "提示",
    dialogCancel: "取消",
    dialogConfirm: "确定",
    defaultGroupName: "已打开标签",
    groupCount: "{count} 项",
    noMatchedTabs: "当前没有匹配的已打开标签。",
    tabDropdownTitle: "添加到分组",
    noGroupHint: "请先创建一个分组",
    addToGroupTitle: "添加到分组",
    addToGroupBtnTitle: "添加到分组",
    closeTabBtnTitle: "关闭标签",
    editUrlBtnTitle: "编辑网址",
    deleteUrlBtnTitle: "删除网址",
    urlExistsInGroup: "此网址已存在于目标分组中。",
    addedToGroup: "已添加到分组「{name}」。",
    editGroup: "编辑分组",
    deleteGroup: "删除分组",
    confirmDeleteGroup: "确认删除此分组？此操作无法撤销。",
    newGroup: "新增分组",
    groupName: "分组名称",
    enterGroupName: "请输入分组名称",
    create: "创建",
    save: "保存",
    addWebsiteToGroup: "新增网站到分组",
    websiteName: "网站名称",
    enterWebsiteName: "请输入网站名称",
    websiteUrl: "网站地址",
    enterWebsiteUrl: "请输入完整网址，例如 https://example.com",
    add: "添加",
    importConfirm: "导入将覆盖当前本地分组数据，是否继续？",
    importSuccess: "分组数据已导入。",
    importFail: "导入失败：文件格式不正确。",
    defaultGroupHint: "当前为分组内容，可编辑、删除网站，或手动新增网址。",
    groupMenuCount: "{count} 个",
    noMatchedGroupTabs: "当前分组暂无匹配网站。"
  },
  en: {
    title: "Tab Manager - SchierTabManager",
    appTitle: "🏷️ SchierTabManager Tab Manager",
    shortcutNote: "Toggle the manager page with Ctrl+Q by default. Customize in browser extension shortcut settings.",
    groupManagement: "Group Management",
    groupManagementHint: "Manage your tab groups.",
    addGroup: "+ Add Group",
    openTabs: "Open Tabs",
    groupHintOpenTabs: "Hover tabs to show quick actions, then click + to add to a group.",
    groupHintGroupContent: "Viewing group content. Edit, delete, or manually add sites.",
    addSite: " Add Site",
    searchPlaceholder: "Search tabs by title or URL...",
    closeDuplicate: "Remove Duplicates",
    refresh: "Refresh",
    importData: "Import",
    exportData: "Export",
    switchToEnglish: "English",
    switchToChinese: "中文",
    dialogTitle: "Prompt",
    dialogCancel: "Cancel",
    dialogConfirm: "Confirm",
    defaultGroupName: "Open Tabs",
    groupCount: "{count} items",
    noMatchedTabs: "No matching open tabs found.",
    tabDropdownTitle: "Add to Group",
    noGroupHint: "Please create a group first.",
    addToGroupTitle: "Add to Group",
    addToGroupBtnTitle: "Add to Group",
    closeTabBtnTitle: "Close Tab",
    editUrlBtnTitle: "Edit URL",
    deleteUrlBtnTitle: "Delete URL",
    urlExistsInGroup: "This URL already exists in the target group.",
    addedToGroup: "Added to group \"{name}\".",
    editGroup: "Edit Group",
    deleteGroup: "Delete Group",
    confirmDeleteGroup: "Are you sure you want to delete this group? This action cannot be undone.",
    newGroup: "New Group",
    groupName: "Group Name",
    enterGroupName: "Enter group name",
    create: "Create",
    save: "Save",
    addWebsiteToGroup: "Add Website to Group",
    websiteName: "Website Name",
    enterWebsiteName: "Enter website name",
    websiteUrl: "Website URL",
    enterWebsiteUrl: "Enter a full URL, e.g. https://example.com",
    add: "Add",
    importConfirm: "Importing will overwrite current local group data. Continue?",
    importSuccess: "Group data imported successfully.",
    importFail: "Import failed: invalid file format.",
    defaultGroupHint: "Viewing group content. Edit, delete, or manually add sites.",
    groupMenuCount: "{count} items",
    noMatchedGroupTabs: "No matching sites in this group."
  }
};

let currentLanguage = "zh";

export function initLanguage() {
  const saved = localStorage.getItem("language");
  currentLanguage = saved === "en" ? "en" : "zh";
}

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  currentLanguage = lang === "en" ? "en" : "zh";
  localStorage.setItem("language", currentLanguage);
}

export function toggleLanguage() {
  setLanguage(currentLanguage === "zh" ? "en" : "zh");
}

export function t(key, vars = {}) {
  const translation = translations[currentLanguage]?.[key] ?? translations.zh?.[key] ?? key;
  return translation.replace(/\{(\w+)\}/g, (_, name) => {
    return vars[name] !== undefined ? vars[name] : `{${name}}`;
  });
}

export function applyLocale() {
  document.title = t("title");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });

  const langBtn = document.getElementById("languageToggle");
  if (langBtn) {
    langBtn.textContent = currentLanguage === "zh" ? t("switchToEnglish") : t("switchToChinese");
  }
}
