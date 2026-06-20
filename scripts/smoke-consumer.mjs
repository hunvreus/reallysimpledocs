import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const tempRoot = path.join(root, ".tmp", "consumer-smoke");
const packDir = path.join(tempRoot, "pack");
const appDir = path.join(tempRoot, "app");

const run = (command, args, options = {}) => {
  execFileSync(command, args, {
    cwd: options.cwd || root,
    stdio: "inherit",
    env: {
      ...process.env,
      npm_config_audit: "false",
      npm_config_fund: "false",
      npm_config_update_notifier: "false",
    },
  });
};

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const assertFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${path.relative(appDir, filePath)}`);
  }
};

const assertIncludes = (filePath, expected) => {
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(expected)) {
    throw new Error(`Expected ${path.relative(appDir, filePath)} to include: ${expected}`);
  }
};

const assertNotIncludes = (filePath, expected) => {
  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes(expected)) {
    throw new Error(`Expected ${path.relative(appDir, filePath)} not to include: ${expected}`);
  }
};

const assertSearchBodyHasNoHtml = (filePath) => {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const items = Array.isArray(data) ? data : data.documents || [];
  const offender = items.find((item) => /<\/?[a-z][\s\S]*>/i.test(item.body || ""));
  if (offender) {
    throw new Error(`Expected search body for ${offender.slug} not to include raw HTML.`);
  }
};

fs.rmSync(tempRoot, { recursive: true, force: true });
fs.mkdirSync(packDir, { recursive: true });
fs.mkdirSync(appDir, { recursive: true });

run("npm", ["pack", "--pack-destination", packDir]);

const tarball = fs.readdirSync(packDir).find((file) => file.endsWith(".tgz"));
if (!tarball) throw new Error("npm pack did not create a tarball.");

writeJson(path.join(appDir, "package.json"), {
  type: "module",
  private: true,
  scripts: {
    build: "astro build",
  },
  dependencies: {
    astro: "^6.4.6",
    "basecoat-css": "1.0.0-beta.3",
    reallysimpledocs: `file:${path.join(packDir, tarball)}`,
    tailwindcss: "4.1.17",
  },
});

fs.writeFileSync(
  path.join(appDir, "astro.config.mjs"),
  `import { defineConfig } from "astro/config";
import reallySimpleDocs from "reallysimpledocs/astro";

export default defineConfig({
  site: "https://example.com",
  output: "static",
  integrations: [
    reallySimpleDocs({
      docsDir: "./docs",
      routeBase: "/docs",
      site: {
        title: "Consumer docs",
        description: "Consumer smoke test docs.",
        url: "https://example.com",
      },
    }),
  ],
});
`,
);

fs.mkdirSync(path.join(appDir, "docs"), { recursive: true });
fs.mkdirSync(path.join(appDir, "src", "pages"), { recursive: true });
fs.writeFileSync(
  path.join(appDir, "src", "pages", "index.astro"),
  `---
---

<main class="p-6">
  <a href="/docs/" class="btn">Open docs</a>
  <p class="text-balance decoration-wavy">custom-page-tailwind-smoke</p>
</main>
`,
);
writeJson(path.join(appDir, "docs", "docs.json"), {
  menu: [
    {
      type: "group",
      label: "Start",
      items: [
        { slug: "index", icon: "info" },
        {
          type: "submenu",
          label: "Learn",
          items: [
            { slug: "guide", icon: "book-open", badge: "Beta" },
            { slug: "interactive", icon: "blocks" },
            {
              label: "External",
              url: "https://example.com/external",
              icon: "arrow-up-right",
              attrs: { target: "_blank", rel: "noopener" },
            },
            {
              type: "submenu",
              label: "Deep",
              items: [{ slug: "deep/nested", icon: "file-text" }],
            },
          ],
        },
      ],
    },
  ],
});
fs.writeFileSync(
  path.join(appDir, "docs", "index.md"),
  `# Welcome

This page proves the packaged integration can render a consumer docs site.

## First section

Search should find this consumer-only keyword: orbit-smoke.
`,
);
fs.writeFileSync(
  path.join(appDir, "docs", "guide.md"),
  `# Guide

This is a second page for navigation.
`,
);
fs.writeFileSync(
  path.join(appDir, "docs", "interactive.mdx"),
  `export const demoSource = \`<button type="button" class="btn">Smoke action</button>\`;

# Interactive

This page proves packaged MDX docs can render default ReallySimpleDocs components without imports.

<Callout title="MDX works" icon="sparkles">
  Consumer-only keyword: mdx-orbit-smoke.
</Callout>

<Preview code={demoSource} lang="html">
  <button type="button" class="btn">Smoke action</button>
</Preview>

<Code title="Command" lang="bash" code={\`npm run build\`} />
`,
);
fs.mkdirSync(path.join(appDir, "docs", "deep"), { recursive: true });
fs.writeFileSync(
  path.join(appDir, "docs", "deep", "nested.md"),
  `# Nested

This nested page proves recursive navigation exports.
`,
);

run("npm", ["install"], { cwd: appDir });
run("npm", ["run", "build"], { cwd: appDir });

assertFile(path.join(appDir, "dist", "docs", "index.html"));
assertFile(path.join(appDir, "dist", "docs", "guide", "index.html"));
assertFile(path.join(appDir, "dist", "docs", "interactive", "index.html"));
assertFile(path.join(appDir, "dist", "docs", "deep", "nested", "index.html"));
assertFile(path.join(appDir, "dist", "docs", "search-index.json"));
assertFile(path.join(appDir, "dist", "docs", "index.md"));
assertFile(path.join(appDir, "dist", "docs", "guide.md"));
assertFile(path.join(appDir, "dist", "docs", "interactive.md"));
assertFile(path.join(appDir, "dist", "docs", "deep", "nested.md"));
assertFile(path.join(appDir, "dist", "llms.txt"));
assertFile(path.join(appDir, "dist", "llms-full.txt"));

const cssFiles = fs.readdirSync(path.join(appDir, "dist", "_astro")).filter((file) => file.endsWith(".css"));
const cssOutput = cssFiles.map((file) => fs.readFileSync(path.join(appDir, "dist", "_astro", file), "utf8")).join("\n");
if (!cssOutput.includes(".text-balance") || !cssOutput.includes(".decoration-wavy")) {
  throw new Error("Expected managed ReallySimpleDocs CSS to include classes used by custom src/pages content.");
}

assertIncludes(path.join(appDir, "dist", "docs", "index.html"), "Welcome");
assertIncludes(path.join(appDir, "dist", "docs", "index.html"), "_astro/");
assertIncludes(path.join(appDir, "dist", "docs", "index.html"), 'data-md-url="/docs/index.md"');
assertIncludes(path.join(appDir, "dist", "docs", "index.html"), 'href="/docs/index.md"');
assertNotIncludes(path.join(appDir, "dist", "docs", "index.html"), 'href="/docs.md"');
assertIncludes(path.join(appDir, "dist", "docs", "search-index.json"), "orbit");
assertIncludes(path.join(appDir, "dist", "docs", "search-index.json"), "smoke");
assertIncludes(path.join(appDir, "dist", "docs", "search-index.json"), "mdx");
assertIncludes(path.join(appDir, "dist", "docs", "interactive", "index.html"), "MDX works");
assertIncludes(path.join(appDir, "dist", "docs", "interactive", "index.html"), "Smoke action");
assertIncludes(path.join(appDir, "dist", "docs", "interactive", "index.html"), "lucide-sparkles");
assertNotIncludes(path.join(appDir, "dist", "docs", "interactive.md"), 'from "reallysimpledocs/components"');
assertNotIncludes(path.join(appDir, "dist", "docs", "interactive.md"), "<Callout");
assertIncludes(path.join(appDir, "dist", "docs", "interactive.md"), "> **MDX works**");
assertNotIncludes(path.join(appDir, "dist", "docs", "search-index.json"), "<Callout");
assertSearchBodyHasNoHtml(path.join(appDir, "dist", "docs", "search-index.json"));
assertIncludes(path.join(appDir, "dist", "docs", "guide", "index.html"), "Beta");
assertIncludes(path.join(appDir, "dist", "docs", "guide", "index.html"), "https://example.com/external");
assertIncludes(path.join(appDir, "dist", "llms.txt"), "Consumer docs");
assertIncludes(path.join(appDir, "dist", "llms.txt"), "- [Welcome](https://example.com/docs/)");
assertIncludes(path.join(appDir, "dist", "llms.txt"), "- [Guide](https://example.com/docs/guide/)");
assertIncludes(path.join(appDir, "dist", "llms.txt"), "- [Interactive](https://example.com/docs/interactive/)");
assertIncludes(path.join(appDir, "dist", "llms.txt"), "- [Nested](https://example.com/docs/deep/nested/)");

console.log("Consumer smoke test passed.");
