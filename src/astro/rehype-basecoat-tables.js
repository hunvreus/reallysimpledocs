import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

const containerClass = ["table-container", "scrollbar", "my-6"];
const tableClass = ["table"];

export function rehypeBasecoatTables() {
  return (tree) => {
    transformTables(tree);
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
