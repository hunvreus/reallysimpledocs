import { docUrl, fallbackLabelFromSlug, flattenMenuSlugs } from "./menu.js";

export const registerNavigationFilters = (eleventyConfig, lucideIcons) => {
  const lucideSvg = (iconName) => {
    if (!iconName) return null;
    const pascalName = iconName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
    const iconComponent = lucideIcons?.[pascalName];
    if (!iconComponent) return null;
    return iconComponent.replace('class="lucide', `class="lucide lucide-${iconName}`);
  };

  const resolveIcon = (icon) => {
    if (!icon) return null;
    if (typeof icon !== "string") return icon;
    const trimmed = icon.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("<svg")) return trimmed;
    return lucideSvg(trimmed) || null;
  };

  const buildMenus = (menu, collections) => {
    const docs = collections?.docs || [];
    const docsByUrl = new Map(docs.map((doc) => [doc.url, doc]));

    const processSlug = (slug) => {
      const url = docUrl(slug);
      const doc = docsByUrl.get(url);
      const title = doc?.data?.title ? String(doc.data.title) : fallbackLabelFromSlug(slug);
      const description = doc?.data?.description ? String(doc.data.description) : "";
      const iconSvg = resolveIcon(doc?.data?.icon) || null;

      const sidebarItem = {
        icon: iconSvg,
        url,
        label: title,
        description,
      };

      const keywords = [title, description].filter(Boolean).join(" ");
      const iconHtml = iconSvg ? iconSvg : "";
      const commandItem = {
        type: "item",
        label: title,
        content: `${iconHtml}<span>${title}</span>`,
        keywords,
        attrs: {
          onclick: `window.location.href='${url}'; this.closest('dialog')?.close();`,
        },
      };

      return { sidebar: sidebarItem, command: commandItem };
    };

    const processItem = (item) => {
      if (typeof item === "string") return processSlug(item);

      if (item?.type === "submenu") {
        const submenuIcon = resolveIcon(item.icon) || null;
        const sidebarItems = (item.items || []).map((sub) => processItem(sub).sidebar);
        const commandItems = (item.items || []).map((sub) => processItem(sub).command);
        return {
          sidebar: { ...item, icon: submenuIcon, items: sidebarItems },
          command: { type: "group", label: item.label, items: commandItems },
        };
      }

      return { sidebar: null, command: null };
    };

    const processedGroups = (menu || []).map((group) => {
      if (group?.type !== "group") return { sidebar: group, command: group };

      const sidebarItems = (group.items || [])
        .map((item) => processItem(item).sidebar)
        .filter(Boolean);
      const commandItems = (group.items || [])
        .map((item) => processItem(item).command)
        .filter(Boolean);

      return {
        sidebar: { ...group, items: sidebarItems },
        command: { type: "group", label: group.label, items: commandItems },
      };
    });

    return {
      sidebar: processedGroups.map((p) => p.sidebar),
      command: processedGroups.map((p) => p.command),
    };
  };

  eleventyConfig.addFilter("getNavigation", function getNavigation(menu, collections) {
    const flattened = flattenMenuSlugs(menu);
    const currentUrl = this.page.url;
    const index = flattened.findIndex((slug) => docUrl(slug) === currentUrl);
    if (index === -1) return { prev: null, next: null };

    const labelFor = (slug) => {
      const url = docUrl(slug);
      const doc = collections?.docs?.find((d) => d.url === url);
      if (doc?.data?.title) return String(doc.data.title);
      return fallbackLabelFromSlug(slug);
    };

    return {
      prev: index > 0 ? { url: docUrl(flattened[index - 1]), label: labelFor(flattened[index - 1]) } : null,
      next:
        index < flattened.length - 1
          ? { url: docUrl(flattened[index + 1]), label: labelFor(flattened[index + 1]) }
          : null,
    };
  });

  eleventyConfig.addFilter("sidebarMenu", function sidebarMenu(menu, collections) {
    return buildMenus(menu, collections).sidebar;
  });

  eleventyConfig.addFilter("commandMenu", function commandMenu(menu, collections) {
    return buildMenus(menu, collections).command;
  });
};
