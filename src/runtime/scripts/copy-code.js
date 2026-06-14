import Copy from "lucide-static/icons/copy.svg?raw";
import Check from "lucide-static/icons/check.svg?raw";

const copyText = async (text) => {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("Copy failed");
};

const activePanelCode = (root) => root.querySelector(':scope > [role="tabpanel"]:not([hidden]) code');

const initCopyCode = (codeBlock) => {
  const codeEl = codeBlock.querySelector(":scope > code");
  if (!codeEl) return;

  let target = null;
  let frame = codeBlock.closest(".code-group");
  let getCode = frame ? () => activePanelCode(frame) || codeEl : () => codeEl;
  if (frame) target = frame.querySelector(":scope > header");

  const preview = codeBlock.closest(".preview");
  const previewCodePanel = preview?.querySelector(":scope > [data-code-panel]");
  if (!frame && previewCodePanel?.contains(codeBlock)) {
    frame = preview;
    target = frame.querySelector(":scope > header");
    getCode = () => codeEl;
  }

  if (!frame) {
    frame = codeBlock.parentElement?.classList.contains("code-block") ? codeBlock.parentElement : null;
    if (!frame) {
      frame = document.createElement("div");
      frame.className = "code-block";
      codeBlock.parentNode.insertBefore(frame, codeBlock);
      frame.appendChild(codeBlock);
    }
  }

  target ||= frame.querySelector(":scope > header") || frame;

  if (target.querySelector(":scope > button[aria-label='Copy code']")) {
    codeBlock.dataset.copyCodeInitialized = true;
    return;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Copy code");
  button.innerHTML = Copy;

  button.addEventListener("click", async () => {
    const text = (getCode()?.textContent || "").replace(/\n$/, "");
    if (!text) return;

    button.disabled = true;
    try {
      await copyText(text);
      button.innerHTML = Check;
    } catch (error) {
      console.error("[copy] Failed to copy:", error);
      button.textContent = "Failed";
    }
    window.setTimeout(() => {
      button.disabled = false;
      button.innerHTML = Copy;
    }, 1200);
  });

  target.appendChild(button);
  codeBlock.dataset.copyCodeInitialized = true;
};

window.basecoat?.register("copy-code", "pre:has(> code):not([data-copy-code-initialized])", initCopyCode);
