import eleventyLucideicons from "@grimlink/eleventy-plugin-lucide-icons";
import * as lucideIcons from "lucide-static";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import pluginTOC from "eleventy-plugin-toc";
import fs from "node:fs";
import path from "node:path";

export default async function(eleventyConfig) {
  // Config
  eleventyConfig.setInputDirectory("docs");
  eleventyConfig.setOutputDirectory("_site");
  eleventyConfig.setIncludesDirectory("../_includes");
  eleventyConfig.setDataDirectory("../_data");

  // Plugins
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPlugin(eleventyLucideicons);
  let options = {
    html: true,
    breaks: true,
    linkify: true,
  };

  // Global data
  let configuredSiteUrl = null;
  let configuredSite = null;
  try {
    const raw = fs.readFileSync(new URL("./_data/site.json", import.meta.url), "utf8");
    configuredSite = JSON.parse(raw) || null;
    configuredSiteUrl = configuredSite?.url || null;
  } catch (_) {}

  const isServe = process.argv.includes("--serve");

  eleventyConfig.addGlobalData(
    "siteUrl",
    process.env.SITE_URL ||
      (isServe ? "http://localhost:8080" : configuredSiteUrl || ""),
  );

  const stripFrontMatter = (source) => {
    if (!source.startsWith("---")) return { frontmatter: {}, content: source };
    const match = source.match(/^---\s*\n[\s\S]*?\n---\s*\n?/);
    if (!match) return { frontmatter: {}, content: source };

    const rawFrontmatter = match[0]
      .replace(/^---\s*\n/, "")
      .replace(/\n---\s*\n?$/, "");

    const frontmatter = {};
    rawFrontmatter.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf(":");
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    });

    return { frontmatter, content: source.slice(match[0].length) };
  };

  const slugFromDocPath = (absolutePath, docsRoot) => {
    const relative = path.relative(docsRoot, absolutePath).replaceAll(path.sep, "/");
    const withoutExt = relative.replace(/\.md$/, "");
    return withoutExt === "index" ? "index" : withoutExt;
  };

  const docUrlFromSlug = (slug) => {
    if (slug === "index") return "/";
    if (slug.endsWith("/index")) return "/" + slug.replace(/\/index$/, "/");
    return "/" + slug + "/";
  };

  const markdownExportPathFromSlug = (slug) => {
    if (slug === "index") return "index.md";
    if (slug.endsWith("/index")) return `${slug.slice(0, -"/index".length)}.md`;
    return `${slug}.md`;
  };

  const writeTextFile = async (outputDir, relativePath, content) => {
    const outPath = path.join(outputDir, relativePath);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
    await fs.promises.writeFile(outPath, content, "utf8");
  };

  const collectSlugsFromMenu = (menu) => {
    const slugs = [];
    (menu || []).forEach((group) => {
      if (group?.type !== "group") return;
      (group.items || []).forEach((item) => {
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
  };

  eleventyConfig.on("eleventy.after", async (eventsArg) => {
    const outputDir = eventsArg?.directories?.output || eventsArg?.dir?.output;
    const inputDir = eventsArg?.directories?.input || eventsArg?.dir?.input;
    if (!outputDir || !inputDir) return;

    const docsRoot = path.resolve(inputDir);
    const siteUrl = process.env.SITE_URL || (isServe ? "http://localhost:8080" : configuredSiteUrl || "");
    const siteTitle = configuredSite?.title || "Docs";

    const docsJsonPath = path.join(docsRoot, "docs.json");
    let docsConfig = null;
    try {
      docsConfig = JSON.parse(await fs.promises.readFile(docsJsonPath, "utf8"));
    } catch (_) {}

    const menu = docsConfig?.menu || [];
    const menuSlugs = collectSlugsFromMenu(menu);

    const collectMarkdownFiles = async (dir) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...(await collectMarkdownFiles(fullPath)));
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const mdFiles = await collectMarkdownFiles(docsRoot);

    const docs = mdFiles
      .map((filePath) => {
        const slug = slugFromDocPath(filePath, docsRoot);
        const url = docUrlFromSlug(slug);
        const raw = fs.readFileSync(filePath, "utf8");
        const { frontmatter, content } = stripFrontMatter(raw);
        const title = (frontmatter.title || "").trim() || (slug === "index" ? "Introduction" : slug.split("/").pop());
        const description = (frontmatter.description || "").trim();
        return {
          slug,
          url,
          inputPath: filePath,
          title,
          description,
          content: content.trim(),
        };
      })
      .sort((a, b) => a.url.localeCompare(b.url));

    const docsBySlug = new Map(docs.map((d) => [d.slug, d]));
    const docsInMenu = menuSlugs.map((slug) => docsBySlug.get(slug)).filter(Boolean);
    const docsNotInMenu = docs.filter((doc) => !docsInMenu.includes(doc));
    const orderedDocs = [...docsInMenu, ...docsNotInMenu];

    // Per-page Markdown exports (used by "Copy page")
    await Promise.all(
      docs.map(async (doc) => {
        const parts = [`# ${doc.title}`];
        if (doc.description) parts.push(doc.description);
        if (doc.content) parts.push(doc.content);
        const out = parts.join("\n\n") + "\n";
        await writeTextFile(outputDir, markdownExportPathFromSlug(doc.slug), out);
      }),
    );

    // llms.txt (menu-only, short)
    const llmsLines = [`# ${siteTitle}`, "", "## Docs", ""];
    menu.forEach((group) => {
      if (group?.type !== "group") return;
      const groupLabel = group.label || "Docs";
      llmsLines.push(`### ${groupLabel}`, "");

      (group.items || []).forEach((item) => {
        const handleSlug = (slug) => {
          const doc = docsBySlug.get(slug);
          if (!doc) return;
          const fullUrl = `${siteUrl}${doc.url}`;
          if (doc.description) {
            llmsLines.push(`- [${doc.title}](${fullUrl}): ${doc.description}`);
          } else {
            llmsLines.push(`- [${doc.title}](${fullUrl})`);
          }
        };

        if (typeof item === "string") {
          handleSlug(item);
        } else if (item?.type === "submenu" && Array.isArray(item.items)) {
          item.items.forEach(handleSlug);
        }
      });

      llmsLines.push("");
    });

    await writeTextFile(outputDir, "llms.txt", llmsLines.join("\n"));

    // llms-full.txt (menu first, then everything else)
    const fullLines = [];
    orderedDocs.forEach((doc) => {
      const url = `${siteUrl}${doc.url}`;
      fullLines.push(`# ${doc.title}`, `Source: ${url}`, "");
      if (doc.description) fullLines.push(doc.description, "");
      fullLines.push(doc.content, "", "---", "");
    });

    await writeTextFile(outputDir, "llms-full.txt", fullLines.join("\n"));
  });

  let markdownLib = markdownIt(options).use(
    markdownItAnchor,
    { permalink: markdownItAnchor.permalink.headerLink() }
  );

  // Markdown renderer rules
  const defaultTableOpen = markdownLib.renderer.rules.table_open;
  const defaultTableClose = markdownLib.renderer.rules.table_close;

  markdownLib.renderer.rules.table_open = (tokens, idx, options, env, self) => {
    return '<div class="relative w-full overflow-auto my-6"><table>' + (defaultTableOpen ? defaultTableOpen(tokens, idx, options, env, self) : '');
  };

  markdownLib.renderer.rules.table_close = (tokens, idx, options, env, self) => {
    return (defaultTableClose ? defaultTableClose(tokens, idx, options, env, self) : '') + '</table></div>';
  };

  // Markdown library
  eleventyConfig.setLibrary("md", markdownLib);

  // TOC plugin
  eleventyConfig.addPlugin(pluginTOC);

  // Test preview shortcode
  eleventyConfig.addPairedShortcode("test_preview", function(content) {
    return `<div class="test-preview">${content}</div>`;
  });

  // Markdown URL filter
  eleventyConfig.addFilter("markdownUrl", function(pageUrl) {
    if (pageUrl === "/") return "/index.md";
    return pageUrl.replace(/\/$/, "") + ".md";
  });

  // Navigation menu
  var flattenedMenu = null;
  const docUrl = (slug) => {
    if (slug === 'index') return '/';
    if (slug.endsWith('/index')) return '/' + slug.replace(/\/index$/, '/');
    return '/' + slug + '/';
  };

  // Flatten menu
  function flattenMenu(menu) {
    let flat = [];
    menu.forEach(group => {
      if (group.type === 'group') {
        group.items.forEach(item => {
          if (item.type === 'submenu') {
            item.items.forEach(subitem => flat.push(subitem));
          } else {
            flat.push(item);
          }
        });
      }
    });
    return flat;
  }
  
  // Get navigation filter
  eleventyConfig.addFilter('getNavigation', function(menu, collections) {
    flattenedMenu = flattenMenu(menu);
    
    const currentUrl = this.page.url;
    
    const index = flattenedMenu.findIndex(item => {
      return docUrl(item) === currentUrl;
    });
    
    if (index === -1) return { prev: null, next: null };

    const labelFor = (slug) => {
      const url = docUrl(slug);
      const doc = collections?.docs?.find(d => d.url === url);
      if (doc?.data?.title) return String(doc.data.title);
      if (slug === 'index') return 'Introduction';

      const parts = String(slug).split('/');
      const last = parts[parts.length - 1];
      const base = last === 'index' && parts.length > 1
        ? parts[parts.length - 2]
        : last;
      return base
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    };
    
    return {
      prev: index > 0 ? {
        url: docUrl(flattenedMenu[index - 1]),
        label: labelFor(flattenedMenu[index - 1])
      } : null,
      next: index < flattenedMenu.length - 1 ? {
        url: docUrl(flattenedMenu[index + 1]),
        label: labelFor(flattenedMenu[index + 1])
      } : null
    };
  });

  // Build menus
  function buildMenus(menu, collections) {

    function processMenuItem(slug) {
      const url = docUrl(slug);
      const doc = collections.docs.find(d => d.url === url);
      const iconName = doc?.data?.icon;
      let iconSvg = null;
      if (iconName) {
        const pascalName = iconName.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
        const iconComponent = lucideIcons[pascalName];
        if (iconComponent) {
          iconSvg = iconComponent.replace('class="lucide', `class="lucide lucide-${iconName}`);
        }
      }
      const sidebarItem = {
        icon: iconSvg,
        url: url,
        label: doc?.data?.title || slug.replace(/\.md$/, ''),
        description: doc?.data?.description || ''
      };
      const iconHtml = iconSvg ? iconSvg : '';
      const keywords = [sidebarItem.label, sidebarItem.description].filter(Boolean).join(' ');
      const commandItem = {
        type: 'item',
        label: sidebarItem.label,
        content: `${iconHtml}<span>${sidebarItem.label}</span>`,
        keywords: keywords,
        attrs: {
          onclick: `window.location.href='${url}'; this.closest('dialog')?.close();`
        }
      };
      return { sidebar: sidebarItem, command: commandItem };
    }

    function processGroup(group) {
      const sidebarItems = group.items.map(item => {
        if (item.type === 'submenu') {
          return {
            ...item,
            items: item.items ? item.items.map(subitem => processMenuItem(subitem).sidebar) : []
          };
        } else {
          return processMenuItem(item).sidebar;
        }
      });
      const commandItems = group.items.map(item => {
        if (item.type === 'submenu') {
          return {
            type: 'group',
            label: item.label,
            items: item.items ? item.items.map(subitem => processMenuItem(subitem).command) : []
          };
        } else {
          return processMenuItem(item).command;
        }
      });
      return {
        sidebar: { ...group, items: sidebarItems },
        command: { type: 'group', label: group.label, items: commandItems }
      };
    }

    const processed = menu.map(processGroup);
    return {
      sidebar: processed.map(p => p.sidebar),
      command: processed.map(p => p.command)
    };
  }

  eleventyConfig.addFilter('sidebarMenu', function(menu, collections) {
    return buildMenus(menu, collections).sidebar;
  });

  eleventyConfig.addFilter('commandMenu', function(menu, collections) {
    return buildMenus(menu, collections).command;
  });

  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
}
