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
    throw new Error(
      `Expected file to exist: ${path.relative(appDir, filePath)}`,
    );
  }
};

const assertIncludes = (filePath, expected) => {
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(expected)) {
    throw new Error(
      `Expected ${path.relative(appDir, filePath)} to include: ${expected}`,
    );
  }
};

const assertNotIncludes = (filePath, expected) => {
  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes(expected)) {
    throw new Error(
      `Expected ${path.relative(appDir, filePath)} not to include: ${expected}`,
    );
  }
};

const assertSearchBodyHasNoHtml = (filePath) => {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const items = Array.isArray(data) ? data : data.documents || [];
  const offender = items.find((item) =>
    /<\/?[a-z][\s\S]*>/i.test(item.body || ""),
  );
  if (offender) {
    throw new Error(
      `Expected search body for ${offender.slug} not to include raw HTML.`,
    );
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
    "basecoat-css": "^1.0.1",
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
      style: "nova",
      bodyAttrs: {
        "data-smoke-body": "ok",
        "hx-target": "#content",
      },
      components: {
        Head: "./src/components/DocsHead.astro",
      },
      shiki: {
        themes: {
          light: "vesper",
          dark: "vesper",
        },
        defaultColor: false,
      },
      site: {
        title: "Consumer docs",
        description: "Consumer smoke test docs.",
        url: "https://example.com",
        favicon: "/favicon.svg",
        socialImage: "/social.png",
      },
    }),
  ],
});
`,
);

fs.mkdirSync(path.join(appDir, "docs"), { recursive: true });
fs.mkdirSync(path.join(appDir, "src", "components"), { recursive: true });
fs.mkdirSync(path.join(appDir, "src", "pages"), { recursive: true });
fs.writeFileSync(
  path.join(appDir, "src", "components", "DocsHead.astro"),
  `---
---

<meta name="docs-head-smoke" content="ok" />
`,
);
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
fs.writeFileSync(
  path.join(appDir, "src", "pages", "outside.mdx"),
  `export const Tabs = ({ tabs, children }) => <section data-tabs-prop={tabs ? "mutated" : "clean"}>{children}</section>;
export const Tab = ({ title, slot, children }) => <article data-slot-prop={slot || "clean"}>{title}{children}</article>;

# Outside MDX

<Tabs>
  <Tab title="Outside tab">outside-mdx-smoke</Tab>
</Tabs>
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

## Linked [reference](https://example.com/reference)

| Option | Value |
| --- | --- |
| Theme | Nova |

\`\`\`bash title="index.sh"
npm run build
\`\`\`
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

## MDX heading anchor

## Linked [MDX reference](https://example.com/mdx-reference)

<Callout title="MDX works" icon="sparkles" action={{ label: "More", href: "/docs/guide/" }}>
  Consumer-only keyword: mdx-orbit-smoke.
</Callout>

<Preview code={demoSource} lang="html">
  <button type="button" class="btn">Smoke action</button>
</Preview>

<Preview>
  <div>Script preview smoke</div>
  <script>window.__rsdScriptPreview = "</Preview>";</script>
</Preview>

<Preview class="w-full max-w-xs">
  <label for="smoke-input" class="flex w-full items-center gap-2">
    Email
    <span class="badge ml-auto" data-variant="secondary">Recommended</span>
  </label>
</Preview>

<CodeGroup>
  \`\`\`bash title='npm "quoted"'
  npm run build
  \`\`\`

  \`\`\`bash title="pnpm &amp; friends"
  pnpm build
  \`\`\`
</CodeGroup>

\`\`\`json title="smoke.json"
{
  "fenced": true
}
\`\`\`

\`\`\`bash
npm run dev
\`\`\`

| Prop | Value |
| --- | --- |
| MDX table | Basecoat |

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
assertFile(path.join(appDir, "dist", "outside", "index.html"));
assertFile(path.join(appDir, "dist", "docs", "search-index.json"));
assertFile(path.join(appDir, "dist", "docs", "index.md"));
assertFile(path.join(appDir, "dist", "docs", "guide.md"));
assertFile(path.join(appDir, "dist", "docs", "interactive.md"));
assertFile(path.join(appDir, "dist", "docs", "deep", "nested.md"));
assertFile(path.join(appDir, "dist", "llms.txt"));
assertFile(path.join(appDir, "dist", "llms-full.txt"));

const cssFiles = fs
  .readdirSync(path.join(appDir, "dist", "_astro"))
  .filter((file) => file.endsWith(".css"));
const cssOutput = cssFiles
  .map((file) =>
    fs.readFileSync(path.join(appDir, "dist", "_astro", file), "utf8"),
  )
  .join("\n");
if (
  !cssOutput.includes(".text-balance") ||
  !cssOutput.includes(".decoration-wavy")
) {
  throw new Error(
    "Expected managed ReallySimpleDocs CSS to include classes used by custom src/pages content.",
  );
}
if (
  !cssOutput.includes(
    '.btn:not([data-size]), .btn[data-size="default"] {\n    height: calc(var(--spacing) * 8);',
  )
) {
  throw new Error(
    "Expected managed ReallySimpleDocs CSS to include the configured Basecoat style.",
  );
}

assertIncludes(path.join(appDir, "dist", "docs", "index.html"), "Welcome");
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<h2 id="linked-reference" tabindex="-1">Linked <a href="https://example.com/reference">reference</a></h2>',
);
assertNotIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<a class="header-anchor" href="#linked-reference">Linked <a href="https://example.com/reference">reference</a></h2>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<body data-smoke-body="ok" hx-target="#content">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<meta name="docs-head-smoke" content="ok">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<meta property="og:image" content="https://example.com/social.png">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<meta name="twitter:image" content="https://example.com/social.png">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<div class="table-container scrollbar my-6">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<table class="table">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  'data-code-title="index.sh"',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  "window.basecoat?.theme.toggle()",
);
assertNotIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  "basecoat:theme",
);
assertIncludes(path.join(appDir, "dist", "docs", "index.html"), "_astro/");
assertIncludes(path.join(appDir, "dist", "index.html"), "_astro/");
assertIncludes(path.join(appDir, "dist", "index.html"), 'rel="stylesheet"');
assertIncludes(
  path.join(appDir, "dist", "outside", "index.html"),
  'data-tabs-prop="clean"',
);
assertIncludes(
  path.join(appDir, "dist", "outside", "index.html"),
  'data-slot-prop="clean"',
);
assertNotIncludes(
  path.join(appDir, "dist", "outside", "index.html"),
  'data-tabs-prop="mutated"',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  'data-md-url="/docs/index.md"',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  'href="/docs/index.md"',
);
assertNotIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  'href="/docs.md"',
);
assertIncludes(path.join(appDir, "dist", "docs", "search-index.json"), "orbit");
assertIncludes(path.join(appDir, "dist", "docs", "search-index.json"), "smoke");
assertIncludes(path.join(appDir, "dist", "docs", "search-index.json"), "mdx");
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  "MDX works",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<h2 id="mdx-heading-anchor" tabindex="-1"><a class="header-anchor" href="#mdx-heading-anchor">MDX heading anchor</a></h2>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<h2 id="linked-mdx-reference" tabindex="-1">Linked <a href="https://example.com/mdx-reference">MDX reference</a></h2>',
);
assertNotIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<a class="header-anchor" href="#linked-mdx-reference">Linked <a href="https://example.com/mdx-reference">MDX reference</a>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<footer> <a class="btn" data-variant="outline" data-size="sm" href="/docs/guide/"> More </a> </footer>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  "Smoke action",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  "Script preview smoke",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  "window.__rsdScriptPreview",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  "npm &quot;quoted&quot;",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  "pnpm &amp; friends",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  'data-code-title="smoke.json"',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<pre class="scrollbar shiki" style="--shiki-light:#FFF;--shiki-dark:#FFF;--shiki-light-bg:#101010;--shiki-dark-bg:#101010;overflow-x:auto" tabindex="0" data-language="bash">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '"fenced"',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  'data-code-title="Command"><header><span>Command</span></header><div class="code-block"><pre class="shiki shiki-themes vesper scrollbar"',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<div class="table-container scrollbar my-6">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<table class="table">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<label for="smoke-input" class="flex w-full items-center gap-2">',
);
assertNotIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<label for="smoke-input" class="flex w-full items-center gap-2"><p>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  "lucide-sparkles",
);
assertNotIncludes(
  path.join(appDir, "dist", "docs", "interactive.md"),
  'from "reallysimpledocs/components"',
);
assertNotIncludes(
  path.join(appDir, "dist", "docs", "interactive.md"),
  "<Callout",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive.md"),
  '```html\n<button type="button" class="btn">Smoke action</button>\n```',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive.md"),
  'window.__rsdScriptPreview = "</Preview>";',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive.md"),
  "> **MDX works**",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive.md"),
  "> [More](/docs/guide/)",
);
assertNotIncludes(
  path.join(appDir, "dist", "docs", "search-index.json"),
  "<Callout",
);
assertSearchBodyHasNoHtml(
  path.join(appDir, "dist", "docs", "search-index.json"),
);
assertIncludes(
  path.join(appDir, "dist", "docs", "guide", "index.html"),
  "Beta",
);
assertIncludes(
  path.join(appDir, "dist", "docs", "guide", "index.html"),
  "https://example.com/external",
);
assertIncludes(path.join(appDir, "dist", "llms.txt"), "Consumer docs");
assertIncludes(
  path.join(appDir, "dist", "llms.txt"),
  "- [Welcome](https://example.com/docs/)",
);
assertIncludes(
  path.join(appDir, "dist", "llms.txt"),
  "- [Guide](https://example.com/docs/guide/)",
);
assertIncludes(
  path.join(appDir, "dist", "llms.txt"),
  "- [Interactive](https://example.com/docs/interactive/)",
);
assertIncludes(
  path.join(appDir, "dist", "llms.txt"),
  "- [Nested](https://example.com/docs/deep/nested/)",
);

console.log("Consumer smoke test passed.");
