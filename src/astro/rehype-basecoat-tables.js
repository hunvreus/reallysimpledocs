import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import GithubSlugger from "github-slugger";

const containerClass = ["table-container", "scrollbar", "my-6"];
const tableClass = ["table"];

export function rehypeBasecoatTables() {
  return (tree) => {
    transformHeadings(tree);
    transformTables(tree);
    transformCodeBlocks(tree);
  };
}

export async function transformBasecoatTablesHtml(html) {
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeBasecoatTables)
    .use(rehypeStringify)
    .process(html);
  return String(file);
}

function transformTables(parent) {
  if (!Array.isArray(parent?.children)) return;

  for (let index = 0; index < parent.children.length; index += 1) {
    const child = parent.children[index];
    if (isElement(child, "table")) {
      addClass(child, tableClass);
      if (isTableContainer(parent)) continue;
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: [...containerClass] },
        children: [child],
      };
      continue;
    }
    transformTables(child);
  }
}

function transformHeadings(parent, slugger = new GithubSlugger()) {
  if (!Array.isArray(parent?.children)) return;

  for (const child of parent.children) {
    if (isHeading(child)) {
      addHeadingAnchor(child, slugger);
      continue;
    }
    transformHeadings(child, slugger);
  }
}

function addHeadingAnchor(node, slugger) {
  if (node.children?.some((child) => isElement(child, "a") && classList(child).includes("header-anchor"))) {
    return;
  }

  node.properties ||= {};
  const id = String(node.properties.id || "") || slugger.slug(nodeText(node));
  if (!id) return;
  node.properties.id = id;
  node.properties.tabIndex ??= -1;
  if (hasElement(node, "a")) return;
  node.children = [
    {
      type: "element",
      tagName: "a",
      properties: { className: ["header-anchor"], href: `#${id}` },
      children: node.children || [],
    },
  ];
}

function isHeading(node) {
  return /^h[1-6]$/.test(node?.tagName || "");
}

function transformCodeBlocks(parent) {
  if (!Array.isArray(parent?.children)) return;

  for (const child of parent.children) {
    if (isElement(child, "pre") && child.children?.some((node) => isElement(node, "code"))) {
      addClass(child, ["scrollbar"]);
      continue;
    }
    transformCodeBlocks(child);
  }
}

function nodeText(node) {
  if (node?.type === "text") return node.value || "";
  if (!Array.isArray(node?.children)) return "";
  return node.children.map(nodeText).join("");
}

function hasElement(node, tagName) {
  if (isElement(node, tagName)) return true;
  return Array.isArray(node?.children) && node.children.some((child) => hasElement(child, tagName));
}

function isElement(node, tagName) {
  return node?.type === "element" && node.tagName === tagName;
}

function isTableContainer(node) {
  return isElement(node, "div") && classList(node).includes("table-container");
}

function addClass(node, classes) {
  const merged = new Set([...classList(node), ...classes]);
  node.properties ||= {};
  node.properties.className = [...merged];
}

function classList(node) {
  const value = node?.properties?.className;
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/\s+/).filter(Boolean);
  return [];
}
