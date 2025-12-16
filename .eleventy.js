import fs from "node:fs";
import eleventyLucideicons from "@grimlink/eleventy-plugin-lucide-icons";
import * as lucideIcons from "lucide-static";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import pluginTOC from "eleventy-plugin-toc";

import { registerLlmExports } from "./src/eleventy/llm-exports.js";
import { registerNavigationFilters } from "./src/eleventy/navigation.js";

export default function eleventyConfigFile(eleventyConfig) {
  // Static assets
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("media");

  // Plugins
  eleventyConfig.addPlugin(eleventyLucideicons);
  eleventyConfig.addPlugin(pluginTOC);

  // Global data
  let site = null;
  try {
    site = JSON.parse(fs.readFileSync(new URL("./_data/site.json", import.meta.url), "utf8")) || null;
  } catch (_) {}

  const configuredSiteUrl = site?.url || "";
  const configuredSiteTitle = site?.title || "ReallySimpleDocs";
  const isServe = process.argv.includes("--serve");
  const resolvedSiteUrl =
    process.env.SITE_URL || (isServe ? "http://localhost:8080" : configuredSiteUrl);

  eleventyConfig.addGlobalData("siteUrl", resolvedSiteUrl);

  // Markdown
  const markdown = markdownIt({ html: true, breaks: true, linkify: true }).use(
    markdownItAnchor,
    { permalink: markdownItAnchor.permalink.headerLink() },
  );

  // Wrap tables in a scroll container.
  const defaultTableOpen = markdown.renderer.rules.table_open;
  const defaultTableClose = markdown.renderer.rules.table_close;
  markdown.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    return (
      '<div class="relative w-full overflow-auto my-6"><table>' +
      (defaultTableOpen ? defaultTableOpen(tokens, idx, options, env, self) : "")
    );
  };
  markdown.renderer.rules.table_close = (tokens, idx, options, env, self) => {
    return (
      (defaultTableClose ? defaultTableClose(tokens, idx, options, env, self) : "") +
      "</table></div>"
    );
  };
  eleventyConfig.setLibrary("md", markdown);

  // Convert an HTML page URL to its generated markdown export path.
  eleventyConfig.addFilter("markdownUrl", function markdownUrl(pageUrl) {
    if (pageUrl === "/") return "/index.md";
    return pageUrl.replace(/\/$/, "") + ".md";
  });

  // Navigation filters (prev/next, sidebar, command menu)
  registerNavigationFilters(eleventyConfig, lucideIcons);

  // Build artifacts (llms.txt, llms-full.txt, per-page markdown exports)
  registerLlmExports(eleventyConfig, {
    getSiteUrl: () => resolvedSiteUrl,
    getSiteTitle: () => configuredSiteTitle,
  });

  return {
    dir: {
      input: "docs",
      output: "_site",
      includes: "../_includes",
      data: "../_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
}
