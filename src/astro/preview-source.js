import { toMarkdown } from "mdast-util-to-markdown";
import { mdxToMarkdown } from "mdast-util-mdx";

export function remarkPreviewSource() {
  return (tree) => {
    visit(tree, (node) => {
      if (node?.type !== "mdxJsxFlowElement") return;
      if (node.name === "Preview") addPreviewSource(node);
      if (node.name === "Tabs") addTabsMetadata(node);
    });
  };
}

function addPreviewSource(node) {
  node.attributes ||= [];
  if (hasAttr(node, "code")) return;

  const source = toMarkdown({ type: "root", children: node.children || [] }, { extensions: [mdxToMarkdown()] }).trim();
  node.attributes.push({ type: "mdxJsxAttribute", name: "code", value: source });
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

function visit(node, visitor) {
  visitor(node);
  if (!Array.isArray(node?.children)) return;
  for (const child of node.children) visit(child, visitor);
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
