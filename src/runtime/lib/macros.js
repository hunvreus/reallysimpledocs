import Search from "lucide-static/icons/search.svg?raw";
import { attrs, escapeHtml } from "./html.js";

export function renderSidebar({
  id = "sidebar",
  label = "Sidebar navigation",
  open = true,
  side = "left",
  header = "",
  footer = "",
  menu = [],
  contentAttrs = { class: "scrollbar" },
} = {}) {
  return `<aside${attrs({
    id,
    class: "sidebar",
    "data-side": side,
    "aria-hidden": open ? "false" : "true",
    inert: open ? undefined : true,
  })}>
  <nav aria-label="${escapeHtml(label)}">
    ${header ? `<header>${header}</header>` : ""}
    <section${attrs(contentAttrs)}>${renderSidebarContent(menu, `${id}-content`)}</section>
    ${footer ? `<footer>${footer}</footer>` : ""}
  </nav>
</aside>`;
}

export function renderSidebarContent(items = [], parentIdPrefix = "content") {
  return items
    .map((item, index) => {
      const itemId = `${parentIdPrefix}-${index + 1}`;

      if (item.type === "group") {
        const groupLabelId = item.id || `group-label-${itemId}`;
        return `<div role="group"${item.label ? attrs({ "aria-labelledby": groupLabelId }) : ""}${attrs(item.attrs)}>
  ${item.label ? `<h3 id="${escapeHtml(groupLabelId)}">${escapeHtml(item.label)}</h3>` : ""}
  <ul>${renderSidebarContent(item.items || [], itemId)}</ul>
</div>`;
      }

      if (item.type === "separator") return `<hr role="separator" />`;

      if (item.type === "submenu") {
        const submenuId = `submenu-${itemId}`;
        return `<li>
  <details${attrs({ id: submenuId, open: item.open ? true : undefined, ...without(item.attrs, ["open"]) })}>
    <summary aria-controls="${escapeHtml(submenuId)}-content">
      ${item.icon || ""}
      <span>${escapeHtml(item.label)}</span>
    </summary>
    <ul id="${escapeHtml(submenuId)}-content">${renderSidebarContent(item.items || [], itemId)}</ul>
  </details>
</li>`;
      }

      return `<li>
  <a${attrs({ href: item.url, "aria-current": item.current ? "page" : undefined, ...without(item.attrs, ["href", "aria-current"]) })}>
    ${item.icon || ""}
    <span>${escapeHtml(item.label)}</span>
  </a>
</li>`;
    })
    .join("");
}

export function renderCommandDialog({
  id = "command-search",
  items = [],
  placeholder = "Search the docs...",
  emptyText = "No results found.",
  open = false,
  commandAttrs = {},
} = {}) {
  return `<dialog${attrs({
    id,
    class: "command-dialog",
    "aria-label": "Command menu",
    open: open ? true : undefined,
    onclick: "if (event.target === this) this.close()",
  })}>
  <div${attrs({ ...commandAttrs, class: ["command", commandAttrs.class].filter(Boolean).join(" ") })}>
    <header>
      ${Search}
      <input${attrs({
        type: "text",
        id: `${id}-input`,
        placeholder,
        autocomplete: "off",
        autocorrect: "off",
        spellcheck: "false",
        "aria-autocomplete": "list",
        role: "combobox",
        "aria-expanded": "true",
        "aria-controls": `${id}-menu`,
      })}>
    </header>
    <div${attrs({
      role: "menu",
      id: `${id}-menu`,
      "aria-orientation": "vertical",
      "data-empty": emptyText,
      class: "scrollbar",
    })}>${renderCommandItems(items, `${id}-items`)}</div>
  </div>
</dialog>`;
}

export function renderCommandItems(items = [], parentIdPrefix = "items") {
  return items
    .map((item, index) => {
      const itemId = `${parentIdPrefix}-${index + 1}`;
      if (item.type === "group") {
        const groupLabelId = item.id || `group-label-${itemId}`;
        return `<div role="group" aria-labelledby="${escapeHtml(groupLabelId)}"${attrs(item.attrs)}>
  <span role="heading" id="${escapeHtml(groupLabelId)}">${escapeHtml(item.label)}</span>
  ${renderCommandItems(item.items || [], itemId)}
</div>`;
      }

      if (item.type === "separator") return `<hr role="separator" />`;

      const commonAttrs = {
        id: itemId,
        role: "menuitem",
        "data-keywords": item.keywords,
        "aria-disabled": item.disabled ? "true" : undefined,
        ...without(item.attrs, ["href"]),
      };

      if (item.url) {
        return `<a${attrs({ ...commonAttrs, href: item.url })}>${item.icon || ""}<span>${escapeHtml(item.label)}</span></a>`;
      }

      return `<div${attrs(commonAttrs)}>${item.icon || ""}<span>${escapeHtml(item.label)}</span></div>`;
    })
    .join("");
}

export function renderDropdownMenu({ id = "dropdown-menu", trigger = "", items = [], triggerAttrs = {}, popoverAttrs = {} } = {}) {
  return `<div id="${escapeHtml(id)}" class="dropdown-menu">
  <button${attrs({
    type: "button",
    id: `${id}-trigger`,
    "aria-haspopup": "menu",
    "aria-controls": `${id}-menu`,
    "aria-expanded": "false",
    ...triggerAttrs,
  })}>${trigger}</button>
  <div${attrs({ id: `${id}-popover`, "data-popover": true, "aria-hidden": "true", ...popoverAttrs })}>
    <div role="menu" id="${escapeHtml(id)}-menu" aria-labelledby="${escapeHtml(id)}-trigger">
      ${renderDropdownItems(items, `${id}-items`)}
    </div>
  </div>
</div>`;
}

export function renderDropdownItems(items = [], parentIdPrefix = "items") {
  return items
    .map((item, index) => {
      const itemId = `${parentIdPrefix}-${index + 1}`;
      if (item.type === "separator") return `<hr role="separator" />`;
      if (item.type === "group") {
        const groupLabelId = item.id || `group-label-${itemId}`;
        return `<div role="group" aria-labelledby="${escapeHtml(groupLabelId)}"${attrs(item.attrs)}>
  <div role="heading" id="${escapeHtml(groupLabelId)}">${escapeHtml(item.label)}</div>
  ${renderDropdownItems(item.items || [], itemId)}
</div>`;
      }
      if (item.url) {
        return `<a${attrs({ id: itemId, role: "menuitem", href: item.url, ...without(item.attrs, ["href"]) })}>${item.icon || ""}${escapeHtml(item.label)}</a>`;
      }
      return `<div${attrs({ id: itemId, role: "menuitem", ...item.attrs })}>${item.icon || ""}${escapeHtml(item.label)}</div>`;
    })
    .join("");
}

function without(value = {}, keys = []) {
  return Object.fromEntries(Object.entries(value || {}).filter(([key]) => !keys.includes(key)));
}
