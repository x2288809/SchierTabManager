const localeCodeMap = {
  en: "en",
  zh: "zh_CN"
};

const translations = {};
let currentLanguage = "en";

function normalizeLanguage(value) {
  if (!value) return "en";
  const normalized = value.toLowerCase();
  if (normalized === "zh" || normalized === "zh_cn" || normalized === "zh-cn") {
    return "zh";
  }
  return normalized.startsWith("zh") ? "zh" : "en";
}

function getBrowserLanguage() {
  const browserLang = typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage
    ? chrome.i18n.getUILanguage()
    : navigator.language;
  return normalizeLanguage(browserLang);
}

async function loadLocale(lang) {
  const localeCode = localeCodeMap[lang] || localeCodeMap.en;
  if (translations[lang]) {
    return translations[lang];
  }

  const url = chrome.runtime.getURL(`_locales/${localeCode}/messages.json`);
  const response = await fetch(url);
  const localeJson = await response.json();

  const messageMap = Object.fromEntries(
    Object.entries(localeJson).map(([key, value]) => [key, value?.message ?? ""])
  );

  translations[lang] = messageMap;
  return messageMap;
}

export function getLanguage() {
  return currentLanguage;
}

export async function initLanguage() {
  const saved = localStorage.getItem("language");
  currentLanguage = saved ? normalizeLanguage(saved) : getBrowserLanguage();
  await loadLocale(currentLanguage);
}

export async function setLanguage(lang) {
  currentLanguage = normalizeLanguage(lang);
  localStorage.setItem("language", currentLanguage);
  await loadLocale(currentLanguage);
}

export async function toggleLanguage() {
  await setLanguage(currentLanguage === "zh" ? "en" : "zh");
}

export function t(key, vars = {}) {
  const translation = translations[currentLanguage]?.[key] || translations.en?.[key] || key;
  return translation.replace(/\{(\w+)\}/g, (_, name) => {
    return vars[name] !== undefined ? vars[name] : `{${name}}`;
  });
}

export async function applyLocale() {
  await loadLocale(currentLanguage);
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
    langBtn.textContent = currentLanguage === "zh" ? t("switchToChinese") : t("switchToEnglish");
  }
}
