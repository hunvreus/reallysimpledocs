import { parseAlert } from "../runtime/lib/alerts.js";
import { parseCodeMeta } from "../runtime/lib/code-meta.js";

export function remarkDocComponents({ docsDir } = {}) {
  const normalizedDocsDir = docsDir ? normalizePath(docsDir).replace(/\/$/, "") : "";

  return (tree, file) => {
    if (normalizedDocsDir && !isDocsFile(file?.path, normalizedDocsDir)) return;

    visit(tree, (node, parent, index) => {
      if (node?.type === "blockquote") return alertToMdx(node);
      if (node?.type === "code") return codeToMdx(node, parent, index);
      if (node?.type !== "mdxJsxFlowElement") return null;
      if (node.name === "Tabs") addTabsMetadata(node);
      return null;
    });
  };
}

function alertToMdx(node) {
  const paragraph = node.children?.[0];
  const text = paragraph?.children?.[0];
  if (paragraph?.type !== "paragraph" || text?.type !== "text") return null;
  if (!text.value.includes("\n") && paragraph.children.length > 1 && paragraph.children[1].type !== "break") return null;
  const alert = parseAlert(text.value);
  if (!alert) return null;
  text.value = alert.content;
  if (!text.value) {
    paragraph.children.shift();
    if (paragraph.children[0]?.type === "break") paragraph.children.shift();
  }
  if (!paragraph.children.length) node.children.shift();
  return {
    type: "mdxJsxFlowElement",
    name: "Callout",
    attributes: Object.entries({ title: alert.title, icon: alert.icon, type: alert.type })
      .filter(([, value]) => value)
      .map(([name, value]) => ({ type: "mdxJsxAttribute", name, value })),
    children: node.children,
  };
}

function isDocsFile(filePath, docsDir) {
  const normalized = normalizePath(filePath || "");
  return normalized === docsDir || normalized.startsWith(`${docsDir}/`);
}

function normalizePath(value) {
  return String(value || "").replaceAll("\\", "/");
}

function codeToMdx(node, parent, index) {
  if (!parent || !Number.isInteger(index)) return null;
  const title = parseCodeMeta(node.meta).title;

  return {
    type: "mdxJsxFlowElement",
    name: "Code",
    attributes: [
      { type: "mdxJsxAttribute", name: "lang", value: node.lang || "text" },
      ...(title ? [{ type: "mdxJsxAttribute", name: "title", value: title }] : []),
      { type: "mdxJsxAttribute", name: "code", value: String(node.value || "") },
    ],
    children: [],
  };
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
