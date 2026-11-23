import { readFile } from "node:fs/promises";
import { dev } from "astro";
import { unified } from "unified";
import rehypeParse from "rehype-parse";

function assertAdjacent(html, mode) {
  const tree = unified().use(rehypeParse).parse(html);
  const body = tree.children.find((node) => node.tagName === "html")?.children.find((node) => node.tagName === "body");
  const elements = body?.children.filter((node) => node.type === "element") || [];
  const index = elements.findIndex((node) => node.tagName === "aside" && node.properties.id === "sidebar");
  if (index < 0 || elements[index + 1]?.tagName !== "main" || elements[index + 1]?.properties.id !== "content") {
    throw new Error(`${mode}: #sidebar must be immediately followed by main#content`);
  }
}

assertAdjacent(await readFile("dist/components/card/index.html", "utf8"), "Production");
const server = await dev({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
try {
  const response = await fetch(`http://127.0.0.1:${server.address.port}/components/card/`);
  if (!response.ok) throw new Error(`Dev server returned ${response.status}`);
  assertAdjacent(await response.text(), "Development");
} finally {
  await server.stop();
}
console.log("Sidebar adjacency verified in development and production.");
