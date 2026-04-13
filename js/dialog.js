import { t } from "./i18n.js";

const dialogOverlay = document.getElementById("dialogOverlay");
const dialogTitleEl = document.getElementById("dialogTitle");
const dialogBodyEl = document.getElementById("dialogBody");
const dialogConfirmBtn = document.getElementById("dialogConfirm");
const dialogCancelBtn = document.getElementById("dialogCancel");
const dialogCloseBtn = document.getElementById("dialogClose");
let dialogResolver = null;
let dialogMode = "form";

export function attachDialogEvents() {
  dialogCancelBtn.addEventListener("click", () => closeDialog(false));
  dialogCloseBtn.addEventListener("click", () => closeDialog(false));
  dialogConfirmBtn.addEventListener("click", () => {
    if (dialogMode === "confirm") {
      closeDialog(true);
    } else {
      closeDialog(collectDialogValues());
    }
  });
  dialogOverlay.addEventListener("click", (e) => {
    if (e.target === dialogOverlay) {
      closeDialog(false);
    }
  });
}

export function showToast(message, type = "info") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast hidden";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => toast.classList.add("hidden"), 2200);
}

export function openDialog({ title, fields, confirmText = t("dialogConfirm") }) {
  dialogMode = "form";
  dialogTitleEl.textContent = title;
  dialogConfirmBtn.textContent = confirmText;
  dialogConfirmBtn.classList.remove("danger");
  dialogCancelBtn.textContent = t("dialogCancel");
  dialogBodyEl.innerHTML = "";

  fields.forEach((field) => {
    const row = document.createElement("div");
    row.className = "dialog-row";

    const label = document.createElement("label");
    label.className = "dialog-label";
    label.textContent = field.label;
    label.setAttribute("for", `dialog-${field.name}`);

    const input = document.createElement("input");
    input.id = `dialog-${field.name}`;
    input.type = field.type || "text";
    input.value = field.value || "";
    input.placeholder = field.placeholder || "";
    input.className = "dialog-input";

    row.append(label, input);
    dialogBodyEl.appendChild(row);
  });

  dialogOverlay.classList.remove("hidden");
  const firstInput = dialogBodyEl.querySelector("input");
  if (firstInput) firstInput.focus();

  return new Promise((resolve) => {
    dialogResolver = resolve;
  });
}

export function openConfirm({ titleKey, messageKey, confirmKey = "dialogConfirm", cancelKey = "dialogCancel" }) {
  dialogMode = "confirm";
  dialogTitleEl.textContent = t(titleKey);
  dialogConfirmBtn.textContent = t(confirmKey);
  dialogCancelBtn.textContent = t(cancelKey);
  dialogBodyEl.innerHTML = "";

  const messageEl = document.createElement("div");
  messageEl.className = "dialog-message";
  messageEl.textContent = t(messageKey);
  dialogBodyEl.appendChild(messageEl);

  dialogConfirmBtn.classList.add("danger");
  dialogOverlay.classList.remove("hidden");

  return new Promise((resolve) => {
    dialogResolver = resolve;
  });
}

export function closeDialog(result = null) {
  dialogOverlay.classList.add("hidden");
  dialogBodyEl.innerHTML = "";
  if (dialogResolver) {
    dialogResolver(result);
    dialogResolver = null;
  }
}

function collectDialogValues() {
  const values = {};
  dialogBodyEl.querySelectorAll("input").forEach((input) => {
    values[input.id.replace("dialog-", "")] = input.value.trim();
  });
  return values;
}
