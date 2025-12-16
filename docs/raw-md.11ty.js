import { readFile } from "node:fs/promises";

function stripFrontMatter(source) {
  if (!source.startsWith("---")) return source;
  const match = source.match(/^---\s*\n[\s\S]*?\n---\s*\n?/);
  return match ? source.slice(match[0].length) : source;
}

function fallbackTitleFromUrl(url) {
  if (url === "/") return "Home";
  const slug = url.replace(/^\/|\/$/g, "").split("/").pop();
  if (!slug) return "Home";
  return slug.replace(/-/g, " ");
}

export const data = {
  eleventyExcludeFromCollections: true,
  layout: null,
  pagination: {
    data: "collections.docs",
    size: 1,
    alias: "doc",
  },
  permalink: ({ doc }) => {
    const stem = doc.filePathStem; // "/getting-started", "/content/index", "/index", ...
    if (stem === "/index") return "/index.md";
    if (stem.endsWith("/index")) return `${stem.slice(0, -"/index".length)}.md`;
    return `${stem}.md`;
  },
};

export default async function render({ doc }) {
  const source = await readFile(doc.inputPath, "utf8");
  const content = stripFrontMatter(source).trim();
  const title = doc.data?.title?.trim() || fallbackTitleFromUrl(doc.url);
  const description = doc.data?.description?.trim();

  const parts = [`# ${title}`];
  if (description) parts.push(description);
  if (content) parts.push(content);
  return parts.join("\n\n") + "\n";
}
