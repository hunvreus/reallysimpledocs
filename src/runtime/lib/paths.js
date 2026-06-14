export const stripSlashes = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

export const routePath = (routeBase, slug) => {
  const base = stripSlashes(routeBase);
  const strippedSlug = stripSlashes(slug);
  const normalizedSlug =
    strippedSlug === "index" ? "" : strippedSlug.endsWith("/index") ? strippedSlug.slice(0, -"/index".length) : strippedSlug;
  const parts = [base, normalizedSlug].filter(Boolean);
  return parts.length ? `/${parts.join("/")}/` : "/";
};

export const routeSlug = (slug) => {
  const strippedSlug = stripSlashes(slug);
  if (strippedSlug === "index") return undefined;
  return strippedSlug.endsWith("/index") ? strippedSlug.slice(0, -"/index".length) : strippedSlug;
};

export const markdownPath = (routeBase, slug) => {
  const base = stripSlashes(routeBase);
  const normalizedSlug = stripSlashes(slug || "index");
  return `/${[base, `${normalizedSlug}.md`].filter(Boolean).join("/")}`;
};

export const routeFilePath = (routeBase, file) => {
  const base = stripSlashes(routeBase);
  const normalizedFile = stripSlashes(file);
  return `/${[base, normalizedFile].filter(Boolean).join("/")}`;
};
