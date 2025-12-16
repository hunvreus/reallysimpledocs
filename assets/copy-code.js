(() => {
  const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
  const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`;

  const getCodeText = (codeEl) => {
    const text = codeEl?.textContent ?? "";
    return text.endsWith("\n") ? text.slice(0, -1) : text;
  };

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  const initCopyCode = (codeBlock) => {
    const codeEl = codeBlock.querySelector(":scope > code");
    if (!codeEl) return;

    codeBlock.classList.add("code-block");

    const existingButton = codeBlock.querySelector(":scope > .code-block-copy");
    if (existingButton) existingButton.remove();

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Copy code");
    button.innerHTML = COPY_ICON;

    const reset = () => {
      button.disabled = false;
      button.innerHTML = COPY_ICON;
    };

    button.addEventListener("click", async () => {
      const text = getCodeText(codeEl);
      if (!text) return;

      button.disabled = true;
      try {
        await copyText(text);
        button.innerHTML = CHECK_ICON;
      } catch (_) {
        button.textContent = "Failed";
      }
      window.setTimeout(reset, 1200);
    });

    codeBlock.insertBefore(button, codeBlock.firstChild);
    codeBlock.dataset.copyCodeInitialized = true;
    codeBlock.dispatchEvent(new CustomEvent("basecoat:initialized"));
  };

  if (window.basecoat) {
    window.basecoat.register(
      "copy-code",
      "pre:not([data-copy-code-initialized])",
      initCopyCode,
    );
  }
})();
