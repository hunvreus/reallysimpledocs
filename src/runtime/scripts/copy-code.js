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

const initCopyCode = (codeBlock) => {
  const codeEl = codeBlock.querySelector(":scope > code");
  if (!codeEl) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "code-block-copy";
  button.setAttribute("aria-label", "Copy code");
  button.innerHTML = Copy;

  button.addEventListener("click", async () => {
    const text = (codeEl.textContent || "").replace(/\n$/, "");
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

  codeBlock.insertBefore(button, codeBlock.firstChild);
  codeBlock.dataset.copyCodeInitialized = true;
};

window.basecoat?.register("copy-code", "pre:not([data-copy-code-initialized])", initCopyCode);
