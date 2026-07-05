import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import GithubSlugger from "github-slugger";
import { codeToHtml } from "shiki";
import * as lucideIcons from "lucide-static";
import { transformBasecoatTablesHtml } from "../../astro/rehype-basecoat-tables.js";
import { parseCodeMeta } from "./code-meta.js";
import { escapeHtml } from "./html.js";
import { normalizeDocMarkdown } from "./markdown-export.js";
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
      description: parsed.description,
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
  return `${getNormalizedDocMarkdown(config, page).trim()}\n`;
}

export async function renderDoc(config, page) {
  const parsed = parseDocMarkdown(getDocMarkdown(config, page), page.title);
  const content = renderNunjucksCompat(parsed.body);
  const headings = [];
  const slugger = new GithubSlugger();
  const renderer = new marked.Renderer();

  renderer.heading = ({ tokens, depth }) => {
    const text = renderer.parser.parseInline(tokens);
    const headingText = plainText(tokens);
    const id = slugger.slug(headingText);
    if (depth > 1 && depth < 4) headings.push({ depth, id, text: headingText });
    const content = hasTokenType(tokens, "link") ? text : `<a class="header-anchor" href="#${id}">${text}</a>`;
    return `<h${depth} id="${id}" tabindex="-1">${content}</h${depth}>`;
  };

  const tokens = marked.lexer(content);
  await highlightCode(tokens, config.shiki);
  const html = marked.parser(tokens, { renderer });
  return { page, html: await transformBasecoatTablesHtml(html), headings };
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
      badge: item.badge,
      current: page.slug === currentSlug,
      keywords: page.title,
      attrs: item.attrs,
    };
  };

  const processItem = (item) => {
    if (typeof item === "string") return processSlug(item);
    if (item?.url && item?.label) {
      return {
        type: "item",
        icon: resolveIcon(item.icon),
        url: item.url,
        label: item.label,
        badge: item.badge,
        external: /^https?:\/\//.test(item.url),
        attrs: item.attrs,
      };
    }
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
      attrs: item.attrs,
    })),
  }));

  return { sidebar, command };
}

export function getLlmDocs(config) {
  return getPages(config).map((page) => ({
    ...page,
    content: getNormalizedDocMarkdown(config, page, { includeTitle: false }).trim(),
  }));
}

export function getSearchDocs(config) {
  const pages = getPages(config);
  const trails = getPageTrails(config, pages);

  return pages.map((page) => {
    const markdown = getNormalizedDocMarkdown(config, page, { includeTitle: false });
    const { prose, code } = splitFencedMarkdown(markdown);
    const trail = trails.get(page.slug) || [page.title];

    return {
      slug: page.slug,
      title: page.title,
      breadcrumb: trail.length > 1 ? trail.join(" › ") : "",
      path: page.path,
      body: markdownPlainText(prose),
      code: markdownPlainText(code),
    };
  });
}

function getPageTrails(config, pages) {
  const manifest = getManifest(config);
  const pagesBySlug = new Map(pages.map((page) => [page.slug, page]));
  const trails = new Map();

  const pageLabel = (item, slug) => {
    if (typeof item === "object" && item?.label) return item.label;
    return pagesBySlug.get(slug)?.title || fallbackLabelFromSlug(slug);
  };

  const walk = (items = [], parents = []) => {
    items.forEach((item) => {
      if (typeof item === "string") {
        trails.set(item, [...parents, pageLabel(item, item)]);
        return;
      }

      if (item?.type === "submenu") {
        walk(item.items || [], [...parents, item.label].filter(Boolean));
        return;
      }

      const slug = getPageItemSlug(item);
      if (slug) trails.set(slug, [...parents, pageLabel(item, slug)]);
    });
  };

  (manifest.menu || []).forEach((group) => {
    if (group?.type === "group") walk(group.items || []);
  });

  return trails;
}

function splitFencedMarkdown(markdown) {
  const code = [];
  const prose = String(markdown || "").replace(/```[^\n]*\n([\s\S]*?)```/g, (_, block) => {
    code.push(block);
    return "\n";
  });

  return { prose, code: code.join("\n\n") };
}

function getNormalizedDocMarkdown(config, page, { includeTitle = true } = {}) {
  const source = getDocMarkdown(config, page);
  const parsed = parseDocMarkdown(source, page.title);
  const body = normalizeDocMarkdown(renderNunjucksCompat(parsed.body), collectMdxExports(source));
  return includeTitle ? `# ${parsed.title}\n\n${body}` : body;
}

function flattenSidebarItems(items = []) {
  return items.flatMap((item) => (item.type === "submenu" ? flattenSidebarItems(item.items) : [item]));
}

export function getPageItemSlug(item) {
  if (!item || typeof item !== "object" || item.type === "submenu") return "";
  return item.slug || item.page || "";
}

function parseDocMarkdown(source, fallbackTitle) {
  const frontmatter = parseFrontmatter(source);
  const content = normalizeDocSource(source);
  const tokens = marked.lexer(content);
  const first = tokens[0];

  if (first?.type !== "heading" || first.depth !== 1) {
    return {
      title: frontmatter.title || fallbackTitle,
      description: frontmatter.description,
      body: content,
    };
  }

  return {
    title: frontmatter.title || plainText(first.tokens || []).trim() || fallbackTitle,
    description: frontmatter.description,
    body: content.slice(first.raw.length).trimStart(),
  };
}

function parseFrontmatter(source) {
  const match = String(source || "").trimStart().match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!match) return {};

  const values = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!field) continue;
    const key = field[1];
    const value = field[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    if (key === "title" || key === "description") values[key] = value;
  }
  return values;
}

function markdownPlainText(markdown) {
  return tokensText(marked.lexer(renderNunjucksCompat(normalizeDocSource(markdown))));
}

function collectMdxExports(source) {
  const values = new Map();
  const pattern = /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*`([\s\S]*?)`;/g;
  for (const match of String(source || "").matchAll(pattern)) {
    values.set(match[1], match[2].replace(/\\n/g, "\n").replace(/\\`/g, "`"));
  }
  return values;
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

async function highlightCode(tokens, shiki) {
  for (const token of tokens) {
    if (token.type === "code") {
      const html = codeBlockHtml(token, await highlightToken(token, shiki));
      Object.assign(token, {
        type: "html",
        raw: html,
        text: html,
        block: true,
      });
      continue;
    }

    for (const childTokens of nestedTokenLists(token)) {
      await highlightCode(childTokens, shiki);
    }
  }
}

function codeBlockHtml(token, html) {
  const title = parseCodeMeta(token.lang).title;
  if (!title) return html;
  return `<div class="code-frame" data-code-title="${escapeHtml(title)}"><header><span>${escapeHtml(title)}</span></header><div class="code-block">${html}</div></div>`;
}

async function highlightToken(token, shiki = {}) {
  const shikiConfig = normalizeShikiConfig(shiki);
  try {
    return await codeToHtml(token.text, {
      lang: normalizeLanguage(token.lang),
      ...shikiConfig,
    });
  } catch {
    return codeToHtml(token.text, {
      lang: "text",
      ...shikiConfig,
    });
  }
}

function normalizeShikiConfig(value = {}) {
  return {
    themes: {
      light: "github-light",
      dark: "github-dark",
      ...(value.themes || {}),
    },
    defaultColor: value.defaultColor ?? false,
  };
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

function hasTokenType(tokens, type) {
  return tokens.some((token) => token.type === type || (token.tokens && hasTokenType(token.tokens, type)));
}

function tokensText(tokens) {
  return tokens
    .map((token) => {
      if (token.type === "html") return htmlText(token.raw || token.text || "");
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

function htmlText(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
