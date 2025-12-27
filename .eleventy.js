import fs from "node:fs";

import eleventyLucideicons from "@grimlink/eleventy-plugin-lucide-icons";
import Shiki from "@shikijs/markdown-it";
import pluginTOC from "eleventy-plugin-toc";
import * as lucideIcons from "lucide-static";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

import { registerLlmExports } from "./src/eleventy/llm-exports.js";
import { registerNavigationFilters } from "./src/eleventy/navigation.js";

const readSiteData = () => {
  try {
    const raw = fs.readFileSync(
      new URL("./_data/site.json", import.meta.url),
      "utf8",
    );
    return JSON.parse(raw) || null;
  } catch {
    return null;
  }
};

export default async function eleventyConfigFile(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("media");

  // Plugins
  eleventyConfig.addPlugin(eleventyLucideicons);
  eleventyConfig.addPlugin(pluginTOC);

  // Global data (for absolute URLs in meta tags + llm exports).
  const site = readSiteData();
  const siteTitle = site?.title || "ReallySimpleDocs";
  const isServe = process.argv.includes("--serve");
  const siteUrl = process.env.SITE_URL || (isServe ? "" : site?.url || "");
  eleventyConfig.addGlobalData("siteUrl", siteUrl);

  // Shiki (build-time syntax highlighting)
  const shiki = await Shiki({
    themes: {
      light: "github-light-default",
      dark: "github-dark-default",
    },
    defaultColor: false, // Use CSS vars only
    colorReplacements: {
      // Override dark theme background to match existing styling
      "github-dark-default": {
        "#24292e": "oklch(0.145 0 0)",
      },
    },
    // Map unknown languages to similar ones
    langAlias: {
      njk: "html",
    },
    fallbackLanguage: "text",
  });

  // Markdown
  const markdown = markdownIt({ html: true, breaks: true, linkify: true })
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.headerLink(),
    })
    .use(shiki);

  const defaultTableOpen = markdown.renderer.rules.table_open;
  const defaultTableClose = markdown.renderer.rules.table_close;
  markdown.renderer.rules.table_open = (tokens, idx, mdOptions, env, self) => {
    return (
      '<div class="relative w-full overflow-auto my-6"><table>' +
      (defaultTableOpen
        ? defaultTableOpen(tokens, idx, mdOptions, env, self)
        : "")
    );
  };
  markdown.renderer.rules.table_close = (tokens, idx, mdOptions, env, self) => {
    return (
      (defaultTableClose
        ? defaultTableClose(tokens, idx, mdOptions, env, self)
        : "") + "</table></div>"
    );
  };
  eleventyConfig.setLibrary("md", markdown);

  eleventyConfig.addFilter("markdownUrl", function markdownUrl(pageUrl) {
    if (pageUrl === "/") return "/index.md";
    return pageUrl.replace(/\/$/, "") + ".md";
  });

  registerNavigationFilters(eleventyConfig, lucideIcons);
  registerLlmExports(eleventyConfig, {
    getSiteUrl: () => siteUrl,
    getSiteTitle: () => siteTitle,
  });

  return {
    dir: {
      input: "docs",
      output: "_site",
      includes: "../_includes",
      layouts: "../_includes/layouts",
      data: "../_data",
    },
    markdownTemplateEngine: "njk",
  };
}
