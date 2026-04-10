import { t } from "./i18n.js";

const dialogOverlay = document.getElementById("dialogOverlay");
const dialogTitleEl = document.getElementById("dialogTitle");
const dialogBodyEl = document.getElementById("dialogBody");
const dialogConfirmBtn = document.getElementById("dialogConfirm");
const dialogCancelBtn = document.getElementById("dialogCancel");
const dialogCloseBtn = document.getElementById("dialogClose");
let dialogResolver = null;

export function attachDialogEvents() {
  dialogCancelBtn.addEventListener("click", () => closeDialog(null));
  dialogCloseBtn.addEventListener("click", () => closeDialog(null));
  dialogConfirmBtn.addEventListener("click", () => closeDialog(collectDialogValues()));
  dialogOverlay.addEventListener("click", (e) => {
    if (e.target === dialogOverlay) {
      closeDialog(null);
    }
  });
}

export function openDialog({ title, fields, confirmText = t("dialogConfirm") }) {
  dialogTitleEl.textContent = title;
  dialogConfirmBtn.textContent = confirmText;
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
