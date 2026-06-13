export const stripSlashes = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

export const routePath = (routeBase, slug) => {
  const base = stripSlashes(routeBase);
  const normalizedSlug = slug === "index" ? "" : stripSlashes(slug);
  const parts = [base, normalizedSlug].filter(Boolean);
  return parts.length ? `/${parts.join("/")}/` : "/";
};

export const routeSlug = (slug) => (slug === "index" ? undefined : slug);

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
