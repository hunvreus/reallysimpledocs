import { toMarkdown } from "mdast-util-to-markdown";
import { mdxToMarkdown } from "mdast-util-mdx";
import { parseCodeMeta } from "../runtime/lib/code-meta.js";

export function remarkPreviewSource({ docsDir } = {}) {
  const normalizedDocsDir = docsDir ? normalizePath(docsDir).replace(/\/$/, "") : "";

  return (tree, file) => {
    if (normalizedDocsDir && !isDocsFile(file?.path, normalizedDocsDir)) return;

    visit(tree, (node, parent, index) => {
      if (node?.type === "code") return codeToMdx(node, parent, index);
      if (node?.type !== "mdxJsxFlowElement") return null;
      if (node.name === "Preview") {
        addPreviewSource(node, file);
        unwrapPreviewMarkdown(node);
      }
      if (node.name === "Tabs") addTabsMetadata(node);
      return null;
    });
  };
}

function isDocsFile(filePath, docsDir) {
  const normalized = normalizePath(filePath || "");
  return normalized === docsDir || normalized.startsWith(`${docsDir}/`);
}

function normalizePath(value) {
  return String(value || "").replaceAll("\\", "/");
}

function addPreviewSource(node, file) {
  node.attributes ||= [];
  if (hasAttr(node, "code")) return;

  const source = formatPreviewSource(getPreviewSource(node, file) ?? toMarkdown({ type: "root", children: node.children || [] }, { extensions: [mdxToMarkdown()] }));
  node.attributes.push({ type: "mdxJsxAttribute", name: "code", value: source });
}

function getPreviewSource(node, file) {
  const value = String(file?.value || "");
  const start = node?.position?.start?.offset;
  const end = node?.position?.end?.offset;
  if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) return null;

  const raw = value.slice(start, end);
  const openEnd = raw.indexOf(">");
  const closeStart = raw.lastIndexOf("</Preview>");
  if (openEnd === -1 || closeStart === -1 || closeStart <= openEnd) return null;

  return raw.slice(openEnd + 1, closeStart);
}

function formatPreviewSource(source) {
  return String(source || "").trim();
}

function codeToMdx(node, parent, index) {
  if (!parent || !Number.isInteger(index)) return null;
  const title = parseCodeMeta(node.meta).title;
  if (!title) return null;

  return {
    type: "mdxJsxFlowElement",
    name: "Code",
    attributes: [
      { type: "mdxJsxAttribute", name: "lang", value: node.lang || "text" },
      { type: "mdxJsxAttribute", name: "title", value: title },
      { type: "mdxJsxAttribute", name: "code", value: String(node.value || "") },
    ],
    children: [],
  };
}

function unwrapPreviewMarkdown(node) {
  if (!Array.isArray(node?.children)) return;

  const preserveDirectParagraphs =
    (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && node.name === "Step";
  if (!preserveDirectParagraphs) {
    node.children = node.children.flatMap((child) => (child?.type === "paragraph" ? child.children || [] : [child]));
  }
  for (const child of node.children) {
    if (child?.type === "mdxJsxFlowElement" || child?.type === "mdxJsxTextElement") unwrapPreviewMarkdown(child);
  }
}

function addTabsMetadata(node) {
  node.attributes ||= [];
  if (hasAttr(node, "tabs")) return;

  const tabNodes = (node.children || []).filter((child) => child?.type === "mdxJsxFlowElement" && child.name === "Tab");
  if (!tabNodes.length) return;

  const seen = new Map();
  const tabs = tabNodes.map((tab, index) => {
    tab.attributes ||= [];
    const title = getAttr(tab, "title") || `Tab ${index + 1}`;
    const value = uniqueValue(slugify(title) || `tab-${index + 1}`, seen);
    if (!hasAttr(tab, "slot")) {
      tab.attributes.push({ type: "mdxJsxAttribute", name: "slot", value });
    }
    return {
      label: title,
      slot: value,
    };
  });

  node.attributes.push({
    type: "mdxJsxAttribute",
    name: "tabs",
    value: JSON.stringify(tabs),
  });
}

function visit(node, visitor, parent = null, index = -1) {
  const replacement = visitor(node, parent, index);
  if (replacement && parent && Number.isInteger(index)) {
    parent.children[index] = replacement;
    node = replacement;
  }
  if (!Array.isArray(node?.children)) return;
  for (let childIndex = 0; childIndex < node.children.length; childIndex += 1) {
    visit(node.children[childIndex], visitor, node, childIndex);
  }
}

function getAttr(node, name) {
  const attr = (node.attributes || []).find((item) => item.type === "mdxJsxAttribute" && item.name === name);
  return typeof attr?.value === "string" ? attr.value : "";
}

function hasAttr(node, name) {
  return (node.attributes || []).some((item) => item.type === "mdxJsxAttribute" && item.name === name);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueValue(value, seen) {
  const count = seen.get(value) || 0;
  seen.set(value, count + 1);
  return count ? `${value}-${count + 1}` : value;
}
