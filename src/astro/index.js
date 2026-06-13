import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

const basecoatStyles = new Set(["vega", "nova", "maia", "lyra", "mira", "luma", "sera", "rhea"]);

const normalizeRouteBase = (routeBase) => {
  const value = String(routeBase || "/").trim();
  if (!value || value === "/") return "";
  return value.replace(/^\/+|\/+$/g, "");
};

const routePattern = (routeBase, suffix = "[...slug]") => {
  const base = normalizeRouteBase(routeBase);
  return base ? `${base}/${suffix}` : suffix;
};

const runtimePath = (relativePath) =>
  fileURLToPath(new URL(`../runtime/${relativePath}`, import.meta.url));

const cssPath = (relativePath) => fileURLToPath(new URL(`../css/${relativePath}`, import.meta.url));

const normalizeArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export default function reallySimpleDocs(options = {}) {
  const style = options.style || "vega";
  if (!basecoatStyles.has(style)) {
    throw new Error(`Invalid ReallySimpleDocs style "${style}". Expected one of: ${Array.from(basecoatStyles).join(", ")}.`);
  }

  const normalizedOptions = {
    docsDir: options.docsDir || "./docs",
    site: options.site || {},
    siteFile: options.siteFile || null,
    style,
    customCss: normalizeArray(options.customCss),
    components: options.components || {},
    routeBase: options.routeBase ?? "/docs",
    assetsBase: options.assetsBase || "/assets",
  };

  return {
    name: "reallysimpledocs",
    hooks: {
      "astro:config:setup": ({ injectRoute, updateConfig, config }) => {
        const root = fileURLToPath(config.root);
        const generatedDir = path.join(root, ".astro", "reallysimpledocs");
        const generatedStyles = path.join(generatedDir, "styles.css");
        const virtualConfig = {
          ...normalizedOptions,
          root,
          docsDir: path.resolve(root, normalizedOptions.docsDir),
          siteFile: normalizedOptions.siteFile ? path.resolve(root, normalizedOptions.siteFile) : null,
          routeBase: normalizeRouteBase(normalizedOptions.routeBase),
        };
        const resolveUserId = (id) => (id?.startsWith(".") ? path.resolve(root, id) : id);
        const components = {
          SidebarHeader:
            normalizedOptions.components.SidebarHeader || runtimePath("components/DefaultSidebarHeader.astro"),
        };
        fs.mkdirSync(generatedDir, { recursive: true });
        fs.writeFileSync(
          generatedStyles,
          [
            '@import "tailwindcss";',
            '@import "basecoat-css/base";',
            `@import "basecoat-css/styles/${style}";`,
            `@import ${JSON.stringify(cssPath("sources.css"))};`,
            `@import ${JSON.stringify(cssPath("custom.css"))};`,
            `@import ${JSON.stringify(cssPath("overrides.css"))};`,
            ...normalizedOptions.customCss.map((css) => `@import ${JSON.stringify(resolveUserId(css))};`),
            `@source ${JSON.stringify(runtimePath("**/*.{astro,js,ts}"))};`,
            `@source ${JSON.stringify(path.join(virtualConfig.docsDir, "**/*.md"))};`,
            "",
          ].join("\n"),
        );

        injectRoute({
          pattern: routePattern(normalizedOptions.routeBase),
          entrypoint: runtimePath("pages/doc.astro"),
        });
        injectRoute({
          pattern: routePattern(normalizedOptions.routeBase, "[...slug].md"),
          entrypoint: runtimePath("pages/markdown.ts"),
        });
        injectRoute({
          pattern: routePattern(normalizedOptions.routeBase, "search-index.json"),
          entrypoint: runtimePath("pages/search-index.ts"),
        });
        injectRoute({
          pattern: "llms.txt",
          entrypoint: runtimePath("pages/llms.txt.ts"),
        });
        injectRoute({
          pattern: "llms-full.txt",
          entrypoint: runtimePath("pages/llms-full.txt.ts"),
        });

        updateConfig({
          vite: {
            build: {
              cssMinify: false,
            },
            plugins: [
              tailwindcss(),
              {
                name: "reallysimpledocs-virtual-modules",
                resolveId(id) {
                  if (id === "virtual:reallysimpledocs/config") return "\0virtual:reallysimpledocs/config";
                  if (id === "virtual:reallysimpledocs/styles.css") return generatedStyles;
                  if (id === "virtual:reallysimpledocs/components/SidebarHeader") {
                    return "\0virtual:reallysimpledocs/components/SidebarHeader";
                  }
                  return null;
                },
                load(id) {
                  if (id === "\0virtual:reallysimpledocs/config") return `export default ${JSON.stringify(virtualConfig)};`;
                  if (id === "\0virtual:reallysimpledocs/components/SidebarHeader") {
                    return `export { default } from ${JSON.stringify(resolveUserId(components.SidebarHeader))};`;
                  }
                  return null;
                },
              },
            ],
          },
        });
      },
    },
  };
}
