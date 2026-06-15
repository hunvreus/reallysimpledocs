import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import GithubSlugger from "github-slugger";
import { codeToHtml } from "shiki";
import * as lucideIcons from "lucide-static";
import { escapeHtml } from "./html.js";
import { markdownPath, routePath } from "./paths.js";

export function getManifest(config) {
  const manifestPath = path.join(config.docsDir, "docs.json");
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

export const fallbackLabelFromSlug = (slug) => {
  if (slug === "index") return "Introduction";
  const parts = String(slug).split("/");
  const last = parts.at(-1);
  const base = last === "index" && parts.length > 1 ? parts.at(-2) : last;
  return base.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const slugToFile = (slug, extension = ".md") => path.join(...String(slug).split("/")) + extension;

export function resolveDocFile(config, slug) {
  for (const extension of [".md", ".mdx"]) {
    const file = slugToFile(slug, extension);
    const filePath = path.join(config.docsDir, file);
    if (fs.existsSync(filePath)) return { file, filePath, extension };
  }
  throw new Error(`Missing docs page for slug "${slug}". Expected .md or .mdx in ${config.docsDir}.`);
}

export function flattenMenuSlugs(menu) {
  const out = [];
  const walk = (items = []) => {
    items.forEach((item) => {
      if (typeof item === "string") {
        out.push(item);
      } else if (getPageItemSlug(item)) {
        out.push(getPageItemSlug(item));
      } else if (item?.type === "submenu") {
        walk(item.items || []);
      }
    });
  };

  (menu || []).forEach((group) => {
    if (group?.type === "group") walk(group.items || []);
  });
  return out;
}

export function getPages(config) {
  const manifest = getManifest(config);
  return flattenMenuSlugs(manifest.menu || []).map((slug) => {
    const { file, filePath, extension } = resolveDocFile(config, slug);
    const source = fs.readFileSync(filePath, "utf8");
    const parsed = parseDocMarkdown(source, fallbackLabelFromSlug(slug));
    return {
      slug,
      file,
      extension,
      path: routePath(config.routeBase, slug),
      markdownPath: markdownPath(config.routeBase, slug),
      title: parsed.title,
    };
  });
}

export function getPage(config, slug) {
  const normalizedSlug = slug || "index";
  return getPages(config).find((page) => page.slug === normalizedSlug);
}

export function getDocMarkdown(config, page) {
  const filePath = path.resolve(config.docsDir, page.file);
  const docsRoot = path.resolve(config.docsDir);
  const relativePath = path.relative(docsRoot, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || !fs.existsSync(filePath)) {
    throw new Error(`Invalid docs page file for ${page.slug}: ${page.file}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

export function getMarkdownExport(config, page) {
  return `${getDocMarkdown(config, page).trim()}\n`;
}

export async function renderDoc(config, page) {
  const parsed = parseDocMarkdown(getDocMarkdown(config, page), page.title);
  const { markdown: content, htmlBlocks } = await renderRsdBlocks(renderNunjucksCompat(parsed.body));
  const headings = [];
  const slugger = new GithubSlugger();
  const renderer = new marked.Renderer();

  renderer.heading = ({ tokens, depth }) => {
    const text = renderer.parser.parseInline(tokens);
    const headingText = plainText(tokens);
    const id = slugger.slug(headingText);
    if (depth > 1 && depth < 4) headings.push({ depth, id, text: headingText });
    return `<h${depth} id="${id}" tabindex="-1"><a class="header-anchor" href="#${id}">${text}</a></h${depth}>`;
  };

  renderer.table = (token) => {
    const header = renderer.tablerow({
      text: token.header.map((cell) => renderer.tablecell(cell)).join(""),
    });
    const body = token.rows
      .map((row) =>
        renderer.tablerow({
          text: row.map((cell) => renderer.tablecell(cell)).join(""),
        }),
      )
      .join("");
    const tbody = body ? `<tbody>${body}</tbody>` : "";
    return `<div class="relative my-6 w-full overflow-auto"><table><thead>${header}</thead>${tbody}</table></div>`;
  };

  const tokens = marked.lexer(content);
  await highlightCode(tokens);
  let html = marked.parser(tokens, { renderer });
  htmlBlocks.forEach((block, index) => {
    html = html.replace(`<div data-rsd-block="${index}"></div>`, block);
  });
  return { page, html, headings };
}

async function renderRsdBlocks(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const out = [];
  const htmlBlocks = [];
  let blockId = 0;
  let fence = "";

  for (let index = 0; index < lines.length; index += 1) {
    const fenceMatch = lines[index].match(/^(```+|~~~+)/);
    if (fence) {
      out.push(lines[index]);
      if (lines[index].startsWith(fence)) fence = "";
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      out.push(lines[index]);
      continue;
    }

    const opener = lines[index].match(/^:::\s*([A-Za-z][\w-]*)(?:\s+(.*))?\s*$/);
    if (!opener) {
      out.push(lines[index]);
      continue;
    }

    const name = opener[1];
    const body = [];
    let closed = false;
    index += 1;
    for (; index < lines.length; index += 1) {
      if (/^:::\s*$/.test(lines[index])) {
        closed = true;
        break;
      }
      body.push(lines[index]);
    }

    if (!closed) {
      out.push(lines[index - body.length - 1], ...body);
      break;
    }

    const rendered = await renderRsdBlock(name, opener[2] || "", body.join("\n"), blockId);
    blockId += 1;
    if (rendered) {
      const placeholder = htmlBlocks.length;
      htmlBlocks.push(rendered);
      out.push(`<div data-rsd-block="${placeholder}"></div>`);
    } else {
      out.push([lines[index - body.length - 1], ...body, ":::"].join("\n"));
    }
  }

  return { markdown: out.join("\n"), htmlBlocks };
}

async function renderRsdBlock(name, meta, body, id) {
  const normalized = name.toLowerCase();
  if (["note", "info", "tip", "warning", "danger"].includes(normalized)) {
    return renderCalloutBlock(normalized, meta, body);
  }
  if (normalized === "code-group") return renderCodeGroupBlock(body, id);
  if (normalized === "preview") return renderPreviewBlock(body, id);
  return "";
}

async function renderCalloutBlock(type, meta, body) {
  const options = parseDirectiveMeta(meta);
  const title = options.title || calloutTitle(type);
  const variant = type === "note" ? "info" : type;
  const destructive = variant === "danger";
  const icon = options.icon === "false" ? "" : addIconClass(resolveIcon(options.icon) || defaultCalloutIcon(type), "size-4");
  const content = await renderNestedMarkdown(body);
  return `<div class="${destructive ? "alert-destructive" : "alert"}" data-variant="${escapeHtml(variant)}">
${icon}
<h3>${escapeHtml(title)}</h3>
<section>
${content}
</section>
</div>`;
}

async function renderCodeGroupBlock(body, id) {
  const entries = parseFencedEntries(body);
  if (!entries.length) return "";
  const defaultValue = entries[0].value;
  const tabs = await Promise.all(
    entries.map(async (entry, index) => {
      const selected = entry.value === defaultValue;
      return {
        entry,
        tabId: `rsd-code-group-${id}-tab-${index + 1}`,
        panelId: `rsd-code-group-${id}-panel-${index + 1}`,
        selected,
        html: await renderCodeBlock(entry.code, entry.lang),
      };
    }),
  );
  return `<div class="code-group w-full">
<header>
<div class="tabs">
<nav role="tablist" aria-orientation="horizontal" data-variant="line">
${tabs
  .map(
    (tab) => `<button type="button" role="tab" id="${tab.tabId}" aria-controls="${tab.panelId}" aria-selected="${
      tab.selected ? "true" : "false"
    }" tabindex="${tab.selected ? "0" : "-1"}">${escapeHtml(tab.entry.label)}</button>`,
  )
  .join("\n")}
</nav>
</div>
</header>
${tabs
  .map(
    (tab) => `<div role="tabpanel" id="${tab.panelId}" aria-labelledby="${tab.tabId}" tabindex="-1" aria-selected="${
      tab.selected ? "true" : "false"
    }"${tab.selected ? "" : " hidden"}>
${tab.html}
</div>`,
  )
  .join("\n")}
</div>`;
}

async function renderPreviewBlock(body, id) {
  const entries = parseFencedEntries(body);
  if (!entries.length) return "";
  const entry = entries[0];
  const previewId = `rsd-preview-${id}`;
  const rendered = entry.lang === "html" ? entry.code : await renderCodeBlock(entry.code, entry.lang);
  const code = await renderCodeBlock(entry.code, entry.lang);
  return `<section class="preview">
<header>
<div class="tabs">
<nav role="tablist" aria-orientation="horizontal" data-variant="line">
<button type="button" role="tab" id="${previewId}-preview-tab" aria-controls="${previewId}-preview-panel" aria-selected="true" tabindex="0">Preview</button>
<button type="button" role="tab" id="${previewId}-code-tab" aria-controls="${previewId}-code-panel" aria-selected="false" tabindex="-1">Code</button>
</nav>
</div>
</header>
<section role="tabpanel" data-preview-panel id="${previewId}-preview-panel" aria-labelledby="${previewId}-preview-tab" tabindex="-1" aria-selected="true">
<div class="block w-full">
${rendered}
</div>
</section>
<section role="tabpanel" data-code-panel id="${previewId}-code-panel" aria-labelledby="${previewId}-code-tab" tabindex="-1" aria-selected="false" hidden>
${code}
</section>
</section>`;
}

async function renderNestedMarkdown(markdown) {
  const tokens = marked.lexer(markdown);
  await highlightCode(tokens);
  return marked.parser(tokens);
}

async function renderCodeBlock(code, lang) {
  const html = await highlightToken({ text: code, lang });
  return `<div class="code-block">${html}</div>`;
}

function parseFencedEntries(body) {
  const entries = [];
  const lines = String(body || "").split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const opener = lines[index].match(/^```([^\n`]*)\s*$/);
    if (!opener) continue;
    const code = [];
    index += 1;
    for (; index < lines.length; index += 1) {
      if (/^```\s*$/.test(lines[index])) break;
      code.push(lines[index]);
    }
    const [lang = "text", ...labelParts] = opener[1].trim().split(/\s+/).filter(Boolean);
    const label = labelParts.join(" ") || lang || `Tab ${entries.length + 1}`;
    entries.push({
      lang: lang || "text",
      label,
      value: label.toLowerCase().replace(/\s+/g, "-"),
      code: code.join("\n"),
    });
  }

  return entries;
}

function parseDirectiveMeta(meta) {
  const value = String(meta || "").trim();
  const options = {};
  const attrsMatch = value.match(/\{([^}]*)\}\s*$/);
  const title = (attrsMatch ? value.slice(0, attrsMatch.index) : value).trim();
  if (title) options.title = title.replace(/^["']|["']$/g, "");
  if (!attrsMatch) return options;
  attrsMatch[1].replace(/([\w-]+)=("[^"]*"|'[^']*'|[^\s]+)/g, (_, key, rawValue) => {
    options[key] = String(rawValue).replace(/^["']|["']$/g, "");
    return "";
  });
  return options;
}

function calloutTitle(type) {
  return {
    note: "Note",
    info: "Info",
    tip: "Tip",
    warning: "Warning",
    danger: "Danger",
  }[type];
}

function defaultCalloutIcon(type) {
  return {
    note: resolveIcon("info"),
    info: resolveIcon("info"),
    tip: resolveIcon("lightbulb"),
    warning: resolveIcon("triangle-alert"),
    danger: resolveIcon("circle-alert"),
  }[type];
}

function addIconClass(svg, className) {
  if (!svg) return "";
  const compact = svg.replace(/\s+/g, " ").trim();
  if (compact.includes('class="')) return compact.replace('class="', `class="${className} `);
  return compact.replace("<svg", `<svg class="${escapeHtml(className)}"`);
}

export function getDocHeadings(config, page) {
  const parsed = parseDocMarkdown(getDocMarkdown(config, page), page.title);
  const headings = [];
  const slugger = new GithubSlugger();
  const tokens = marked.lexer(parsed.body);
  tokens.forEach((token) => {
    if (token.type !== "heading" || token.depth <= 1 || token.depth >= 4) return;
    const text = plainText(token.tokens || []).trim();
    if (!text) return;
    headings.push({ depth: token.depth, id: slugger.slug(text), text });
  });
  return headings;
}

export function renderNunjucksCompat(content) {
  return String(content).replace(
    /\{%\s*lucide\s+["']([^"']+)["'](?:\s*,\s*[^%]+)?\s*%\}/g,
    (_, icon) => resolveIcon(icon),
  );
}

export function getNavigation(config, page) {
  const pages = getPages(config);
  const index = pages.findIndex((entry) => entry.slug === page.slug);
  return {
    prev: index > 0 ? pages[index - 1] : null,
    next: index >= 0 && index < pages.length - 1 ? pages[index + 1] : null,
  };
}

export function resolveIcon(icon) {
  if (!icon || typeof icon !== "string") return "";
  const trimmed = icon.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("<svg")) return trimmed;
  const pascalName = trimmed.includes("-")
    ? trimmed
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")
    : trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const iconClass = trimmed.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  const svg = lucideIcons[pascalName] || "";
  if (!svg || svg.includes(`lucide-${iconClass}`)) return svg;
  return svg.replace('class="lucide', `class="lucide lucide-${iconClass}`);
}

export function buildMenus(config, currentSlug) {
  const pages = getPages(config);
  const bySlug = new Map(pages.map((page) => [page.slug, page]));

  const processSlug = (slug, item = {}) => {
    const page = bySlug.get(slug);
    if (!page) return null;
    const icon = resolveIcon(item.icon);
    return {
      type: "item",
      icon,
      url: page.path,
      label: item.label || page.title,
      current: page.slug === currentSlug,
      keywords: page.title,
    };
  };

  const processItem = (item) => {
    if (typeof item === "string") return processSlug(item);
    const slug = getPageItemSlug(item);
    if (slug) return processSlug(slug, item);
    if (item?.type === "submenu") {
      const items = (item.items || []).map(processItem).filter(Boolean);
      return {
        type: "submenu",
        label: item.label,
        icon: resolveIcon(item.icon),
        open: item.open || items.some((child) => child.current),
        items,
      };
    }
    return null;
  };

  const sidebar = (getManifest(config).menu || [])
    .filter((group) => group?.type === "group")
    .map((group) => ({
      type: "group",
      label: group.label,
      items: (group.items || []).map(processItem).filter(Boolean),
    }));

  const command = sidebar.map((group) => ({
    type: "group",
    label: group.label,
    items: flattenSidebarItems(group.items).map((item) => ({
      type: "item",
      icon: item.icon,
      url: item.url,
      label: item.label,
      keywords: item.keywords,
    })),
  }));

  return { sidebar, command };
}

export function getLlmDocs(config) {
  return getPages(config).map((page) => ({
    ...page,
    content: parseDocMarkdown(getDocMarkdown(config, page), page.title).body.trim(),
  }));
}

export function getSearchDocs(config) {
  return getPages(config).map((page) => {
    const parsed = parseDocMarkdown(getDocMarkdown(config, page), page.title);
    return {
      slug: page.slug,
      title: page.title,
      path: page.path,
      body: markdownPlainText(parsed.body),
    };
  });
}

function flattenSidebarItems(items = []) {
  return items.flatMap((item) => (item.type === "submenu" ? flattenSidebarItems(item.items) : [item]));
}

export function getPageItemSlug(item) {
  if (!item || typeof item !== "object" || item.type === "submenu") return "";
  return item.slug || item.page || "";
}

function parseDocMarkdown(source, fallbackTitle) {
  const content = normalizeDocSource(source);
  const tokens = marked.lexer(content);
  const first = tokens[0];

  if (first?.type !== "heading" || first.depth !== 1) {
    return {
      title: fallbackTitle,
      body: content,
    };
  }

  return {
    title: plainText(first.tokens || []).trim() || fallbackTitle,
    body: content.slice(first.raw.length).trimStart(),
  };
}

function markdownPlainText(markdown) {
  return tokensText(marked.lexer(renderNunjucksCompat(normalizeDocSource(markdown))));
}

function normalizeDocSource(source) {
  const withoutFrontmatter = String(source || "")
    .trimStart()
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  const firstHeading = withoutFrontmatter.search(/^#\s+/m);
  if (firstHeading > 0) return withoutFrontmatter.slice(firstHeading).trimStart();
  return withoutFrontmatter
    .replace(/^(?:[ \t]*(?:import|export)\s+[^\n]*\n)+/, "")
    .trimStart();
}

async function highlightCode(tokens) {
  for (const token of tokens) {
    if (token.type === "code") {
      const html = await highlightToken(token);
      Object.assign(token, {
        type: "html",
        raw: html,
        text: html,
        block: true,
      });
      continue;
    }

    for (const childTokens of nestedTokenLists(token)) {
      await highlightCode(childTokens);
    }
  }
}

async function highlightToken(token) {
  try {
    return await codeToHtml(token.text, {
      lang: normalizeLanguage(token.lang),
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
    });
  } catch {
    return codeToHtml(token.text, {
      lang: "text",
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
    });
  }
}

function normalizeLanguage(lang) {
  const value = lang?.trim().split(/\s+/)[0].toLowerCase() || "text";
  if (value === "njk") return "html";
  if (value === "mdx") return "tsx";
  if (value === "sh" || value === "shell") return "bash";
  return value;
}

function nestedTokenLists(token) {
  const lists = [];
  if (token.tokens) lists.push(token.tokens);
  if (token.items) lists.push(...token.items.flatMap((item) => (item.tokens ? [item.tokens] : [])));
  if (token.rows) lists.push(...token.rows.flatMap((cell) => (cell.tokens ? [cell.tokens] : [])));
  if (token.header) lists.push(...token.header.flatMap((cell) => (cell.tokens ? [cell.tokens] : [])));
  return lists;
}

function plainText(tokens) {
  return tokens
    .map((token) => {
      if (token.tokens) return plainText(token.tokens);
      return token.text ?? token.raw ?? "";
    })
    .join("");
}

function tokensText(tokens) {
  return tokens
    .map((token) => {
      const childTokens = [];
      if (token.tokens) childTokens.push(token.tokens);
      if (token.items) childTokens.push(...token.items.flatMap((item) => (item.tokens ? [item.tokens] : [])));
      if (token.rows) childTokens.push(...token.rows.flatMap((row) => row.flatMap((cell) => (cell.tokens ? [cell.tokens] : []))));
      if (token.header) childTokens.push(...token.header.flatMap((cell) => (cell.tokens ? [cell.tokens] : [])));
      return childTokens.length ? childTokens.map(tokensText).join(" ") : token.text || "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
