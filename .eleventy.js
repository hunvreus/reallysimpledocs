import eleventyLucideicons from "@grimlink/eleventy-plugin-lucide-icons";
import * as lucideIcons from "lucide-static";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import pluginTOC from "eleventy-plugin-toc";
import fs from "node:fs";

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
  try {
    const raw = fs.readFileSync(new URL("./_data/site.json", import.meta.url), "utf8");
    configuredSiteUrl = JSON.parse(raw)?.url || null;
  } catch (_) {}

  const isServe = process.argv.includes("--serve");

  eleventyConfig.addGlobalData(
    "siteUrl",
    process.env.SITE_URL ||
      (isServe ? "http://localhost:8080" : configuredSiteUrl || ""),
  );
  
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
