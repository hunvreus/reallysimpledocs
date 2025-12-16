import { readFileSync } from "node:fs";

const docUrl = (slug) => {
  if (slug === "index") return "/";
  if (slug.endsWith("/index")) return "/" + slug.replace(/\/index$/, "/");
  return "/" + slug + "/";
};

function stripFrontMatter(source) {
  if (!source.startsWith("---")) return source;
  const match = source.match(/^---\s*\n[\s\S]*?\n---\s*\n?/);
  return match ? source.slice(match[0].length) : source;
}

function collectSlugsFromMenu(menu) {
  const slugs = [];

  menu.forEach((group) => {
    if (group.type !== "group") return;

    group.items.forEach((item) => {
      if (typeof item === "string") {
        slugs.push(item);
        return;
      }

      if (item?.type === "submenu" && Array.isArray(item.items)) {
        item.items.forEach((subitem) => slugs.push(subitem));
      }
    });
  });

  return [...new Set(slugs)];
}

export const data = {
  eleventyExcludeFromCollections: true,
  layout: null,
  permalink: "/llms-full.txt",
};

export default function render({ collections, menu, siteUrl, site }) {
  const lines = [];

  const slugs = menu ? collectSlugsFromMenu(menu) : [];
  const docsByUrl = new Map(collections.docs.map((doc) => [doc.url, doc]));
  const docsInMenu = slugs
    .map((slug) => docsByUrl.get(docUrl(slug)))
    .filter(Boolean);

  const docsNotInMenu = collections.docs
    .filter((doc) => !docsInMenu.includes(doc))
    .sort((a, b) => a.url.localeCompare(b.url));

  const orderedDocs = [...docsInMenu, ...docsNotInMenu];

  orderedDocs.forEach((doc) => {
    const title = doc.data?.title?.trim();
    const fallbackTitle =
      doc.url.replace(/^\/|\/$/g, "").split("/").pop()?.replace(/-/g, " ") || "Home";
    const resolvedTitle = title || fallbackTitle;
    const description = doc.data?.description?.trim();
    const url = `${siteUrl}${doc.url}`;
    const source = readFileSync(doc.inputPath, "utf8");
    const content = stripFrontMatter(source).trim();

    lines.push(`# ${resolvedTitle}`, `Source: ${url}`, "");
    if (description) lines.push(description, "");
    lines.push(content, "");
    lines.push("---", "");
  });

  return lines.join("\n");
}
