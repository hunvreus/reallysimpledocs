const docUrl = (slug) => {
  if (slug === 'index') return '/';
  if (slug.endsWith('/index')) return '/' + slug.replace(/\/index$/, '/');
  return '/' + slug + '/';
};

export const data = {
  eleventyExcludeFromCollections: true,
  layout: null,
  permalink: "/llms.txt",
};

export default function render({ menu, collections, siteUrl, site }) {
  const lines = [`# ${site.title}`, "", "## Docs", ""];

  menu.forEach((group) => {
    if (group.type === "group") {
      lines.push(`### ${group.label}`, "");
      
      group.items.forEach((item) => {
        if (typeof item === "string") {
          const url = docUrl(item);
          const doc = collections.docs.find((d) => d.url === url);
          
          if (doc) {
            const title = doc.data?.title || item.split("/").pop().replace(/-/g, " ");
            const description = doc.data?.description?.trim() || "";
            const fullUrl = `${siteUrl}${url}`;
            
            if (description) {
              lines.push(`- [${title}](${fullUrl}): ${description}`);
            } else {
              lines.push(`- [${title}](${fullUrl})`);
            }
          }
        } else if (item.type === "submenu" && item.items) {
          item.items.forEach((subitem) => {
            const url = docUrl(subitem);
            const doc = collections.docs.find((d) => d.url === url);
            
            if (doc) {
              const title = doc.data?.title || subitem.split("/").pop().replace(/-/g, " ");
              const description = doc.data?.description?.trim() || "";
              const fullUrl = `${siteUrl}${url}`;
              
              if (description) {
                lines.push(`- [${title}](${fullUrl}): ${description}`);
              } else {
                lines.push(`- [${title}](${fullUrl})`);
              }
            }
          });
        }
      });
      
      lines.push("");
    }
  });

  return lines.join("\n");
}
