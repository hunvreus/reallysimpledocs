import { Copy, Check } from "lucide-static";
import { escapeHtml } from "./html.js";

export function renderCodeBlock(html, { title, actions = "", copy = true, className = "" } = {}) {
  const button = copy
    ? `<button type="button" class="btn" data-variant="ghost" data-size="icon-xs" data-copy aria-label="Copy code">${Copy}${Check}</button>`
    : "";
  const controls = actions || button ? `<div>${actions}${button}</div>` : "";
  const header = title ? `<header><span>${escapeHtml(title)}</span>${controls}</header>` : controls;
  const focusableHtml = String(html).replace(/<pre\b([^>]*)>/, (tag, attributes) =>
    /\btabindex=/.test(attributes) ? tag : `<pre${attributes} tabindex="0">`,
  );
  return `<div data-not-typeset class="${escapeHtml(["code-block", className].filter(Boolean).join(" "))}">${header}${focusableHtml}</div>`;
}
