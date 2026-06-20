import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";
import { remarkPreviewSource } from "./preview-source.js";

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

const normalizeImportPath = (filePath) => filePath.replaceAll(path.sep, "/");

const normalizeBoolean = (value, fallback = true) => (value === undefined ? fallback : Boolean(value));

const shikiConfig = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
};

function collectMdxModules(docsDir) {
  if (!fs.existsSync(docsDir)) return {};
  const modules = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
      const relative = path.relative(docsDir, fullPath).replaceAll(path.sep, "/");
      const slug = relative.replace(/\.mdx$/, "");
      modules[slug] = normalizeImportPath(fullPath);
    }
  };
  walk(docsDir);
  return modules;
}

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
    css: normalizeBoolean(options.css),
    components: options.components || {},
    routeBase: options.routeBase ?? "/docs",
    assetsBase: options.assetsBase || "/assets",
  };

  return {
    name: "reallysimpledocs",
    hooks: {
      "astro:config:setup": ({ injectRoute, injectScript, updateConfig, config }) => {
        const root = fileURLToPath(config.root);
        const generatedDir = path.join(root, ".astro", "reallysimpledocs");
        const generatedStyles = path.join(generatedDir, "styles.css");
        const docsDir = path.resolve(root, normalizedOptions.docsDir);
        const virtualConfig = {
          ...normalizedOptions,
          root,
          docsDir,
          siteFile: normalizedOptions.siteFile ? path.resolve(root, normalizedOptions.siteFile) : null,
          routeBase: normalizeRouteBase(normalizedOptions.routeBase),
        };
        const mdxModules = collectMdxModules(docsDir);
        const resolveUserId = (id) => (id?.startsWith(".") ? path.resolve(root, id) : id);
        const componentDefaults = {
          Head: runtimePath("components/DefaultHeadContent.astro"),
          SidebarHeader: runtimePath("components/DefaultSidebarHeader.astro"),
          SidebarFooter: runtimePath("components/DefaultSidebarFooter.astro"),
          ContentHeader: runtimePath("components/DefaultContentHeader.astro"),
        };
        const components = Object.fromEntries(
          Object.entries(componentDefaults).map(([name, defaultPath]) => [
            name,
            normalizedOptions.components[name] || defaultPath,
          ]),
        );
        fs.mkdirSync(generatedDir, { recursive: true });
        const styleSource = normalizedOptions.css
          ? [
              '@import "tailwindcss";',
              '@import "basecoat-css/base";',
              `@import "basecoat-css/styles/${style}";`,
              `@import ${JSON.stringify(cssPath("custom.css"))};`,
              `@import ${JSON.stringify(cssPath("overrides.css"))};`,
              ...normalizedOptions.customCss.map((css) => `@import ${JSON.stringify(resolveUserId(css))};`),
              `@source ${JSON.stringify(path.join(root, "src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"))};`,
              `@source ${JSON.stringify(runtimePath("**/*.{astro,js,ts}"))};`,
              `@source ${JSON.stringify(path.join(virtualConfig.docsDir, "**/*.{md,mdx}"))};`,
              "",
            ].join("\n")
          : "/* ReallySimpleDocs CSS disabled by config. */\n";
        fs.writeFileSync(generatedStyles, styleSource);
        if (normalizedOptions.css) {
          injectScript("page-ssr", 'import "virtual:reallysimpledocs/styles.css";');
        }

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
          integrations: [
            mdx({
              syntaxHighlight: "shiki",
              shikiConfig,
            }),
          ],
          markdown: {
            processor: unified({
              remarkPlugins: [[remarkPreviewSource, { docsDir }]],
            }),
            shikiConfig,
          },
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
                  if (id === "virtual:reallysimpledocs/mdx-pages") return "\0virtual:reallysimpledocs/mdx-pages";
                  if (id === "virtual:reallysimpledocs/styles.css") return generatedStyles;
                  for (const name of Object.keys(components)) {
                    if (id === `virtual:reallysimpledocs/components/${name}`) {
                      return `\0virtual:reallysimpledocs/components/${name}`;
                    }
                  }
                  return null;
                },
                load(id) {
                  if (id === "\0virtual:reallysimpledocs/config") return `export default ${JSON.stringify(virtualConfig)};`;
                  if (id === "\0virtual:reallysimpledocs/mdx-pages") {
                    const imports = Object.entries(mdxModules)
                      .map(([slug, filePath], index) => `import * as mdx${index} from ${JSON.stringify(filePath)};`)
                      .join("\n");
                    const moduleMap = Object.fromEntries(Object.keys(mdxModules).map((slug, index) => [slug, `mdx${index}`]));
                    return `${imports}
const modules = {
${Object.entries(moduleMap)
  .map(([slug, name]) => `  ${JSON.stringify(slug)}: ${name},`)
  .join("\n")}
};
export async function getMdxPage(slug) {
  return modules[slug || "index"] || null;
}
`;
                  }
                  for (const [name, componentPath] of Object.entries(components)) {
                    if (id === `\0virtual:reallysimpledocs/components/${name}`) {
                      return `export { default } from ${JSON.stringify(resolveUserId(componentPath))};`;
                    }
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
