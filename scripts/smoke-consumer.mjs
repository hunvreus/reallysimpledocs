import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
// Install the same peer versions this repo develops against, so they cannot drift.
const { devDependencies } = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
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
    astro: devDependencies.astro,
    "basecoat-css": devDependencies["basecoat-css"],
    reallysimpledocs: `file:${path.join(packDir, tarball)}`,
    tailwindcss: devDependencies.tailwindcss,
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
        pageSocialImage: "/og/{slug}.png",
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
  `---
description: "Use <account> safely."
---
# Guide

This is a second page for navigation.
`,
);
fs.writeFileSync(
  path.join(appDir, "docs", "interactive.mdx"),
  `export const demoSource = \`<button type="button" class="btn">Smoke action</button>\`;
export const scriptSource = \`window.__rsdScriptPreview = "</Preview>";\`;
export const labelSource = \`<label for="smoke-input" class="flex w-full items-center gap-2">Email</label>\`;

# Interactive

This page proves packaged MDX docs can render default ReallySimpleDocs components without imports.

## MDX heading anchor

## Linked [MDX reference](https://example.com/mdx-reference)

<Callout title="MDX works" icon="sparkles" color="rose" action={{ label: "More", href: "/docs/guide/" }}>
  Consumer-only keyword: mdx-orbit-smoke.
</Callout>

<Preview lang="text" class={1 > 0 ? "block" : ""}>
  <div><strong>Automatic preview text</strong></div>
  <p>Second automatic element</p>
</Preview>

<Preview lang="text" code="Explicit override source">
  <div>Override preview content</div>
</Preview>

<Preview code={demoSource} lang="html">
  <button type="button" class="btn">Smoke action</button>
</Preview>

<Preview code={scriptSource} lang="js">
  <div>Script preview smoke</div>
  <script is:inline>{scriptSource}</script>
</Preview>

<Preview code={labelSource} class="w-full max-w-xs">
  <label for="smoke-input" class="flex w-full items-center gap-2">Email <span class="badge ml-auto" data-variant="secondary">Recommended</span></label>
</Preview>

<Tabs>
<Tab title='npm "quoted"'>

  \`\`\`bash
  npm run build
  \`\`\`

</Tab>
<Tab title="pnpm &amp; friends">

  \`\`\`bash
  pnpm build
  \`\`\`
</Tab>
</Tabs>

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
| MDX table | Typeset |

<div className="typeset-scroll"><table><tbody><tr><td>Already wrapped</td></tr></tbody></table></div>

<div data-not-typeset><table className="table"><tbody><tr><td>Custom component table</td></tr></tbody></table></div>

<Code title="Command" lang="bash" code={\`npm run build\`}>
  <a slot="actions" href="/docs/guide/" class="btn" data-size="xs" data-variant="ghost">Read guide</a>
</Code>
`,
);
fs.mkdirSync(path.join(appDir, "docs", "deep"), { recursive: true });
fs.writeFileSync(
  path.join(appDir, "docs", "deep", "nested.md"),
  `# Nested

This nested page proves recursive navigation exports.
`,
);

const alertFixture = [
  "",
  ...["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"].flatMap((type) => [
    `> [!${type}]`,
    `> Alert **${type.toLowerCase()}** body with [link](https://example.com).`,
    ">",
    "> - Nested list item",
    "",
  ]),
  "> Normal quotation.", "",
  "> [!UNKNOWN]", "> Unsupported alert.", "",
  "> [!NOTE] **same line remains a quote**", "",
  "```md", "> [!WARNING]", "> Literal code sample.", "```", "",
].join("\n");
for (const file of ["index.md", "interactive.mdx"]) {
  fs.appendFileSync(path.join(appDir, "docs", file), alertFixture);
}

run("npm", ["install"], { cwd: appDir });
run("npm", ["run", "build"], { cwd: appDir });

assertFile(path.join(appDir, "dist", "docs", "index.html"));
assertFile(path.join(appDir, "dist", "docs", "guide", "index.html"));
const guideHtml = fs.readFileSync(path.join(appDir, "dist", "docs", "guide", "index.html"), "utf8");
for (const asset of ["all.min.", "lunr.min."]) {
  const script = Array.from(guideHtml.matchAll(/<script[^>]+src="([^"]+)"/g))
    .find(([, src]) => path.basename(src).startsWith(asset));
  if (!script) throw new Error(`Missing browser script: ${asset}`);
  assertFile(path.join(appDir, "dist", script[1]));
}

const guideData = JSON.parse(guideHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const article = guideData["@graph"].find(item => item["@type"] === "TechArticle");
if (article.headline !== "Guide" || article.url !== "https://example.com/docs/guide/" || article.description !== "Use <account> safely.") {
  throw new Error("Invalid article metadata in packaged consumer.");
}
const breadcrumbs = guideData["@graph"].find(item => item["@type"] === "BreadcrumbList");
if (breadcrumbs.itemListElement.map(item => item.item).join(",") !== "https://example.com/docs/,https://example.com/docs/guide/") {
  throw new Error("Invalid documentation breadcrumbs.");
}
assertIncludes(path.join(appDir, "dist", "docs", "guide", "index.html"),
  '<meta property="og:image" content="https://example.com/og/guide.png">');
assertIncludes(path.join(appDir, "dist", "docs", "deep", "nested", "index.html"),
  '<meta property="og:image" content="https://example.com/og/deep/nested.png">');
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
  '<meta property="og:image" content="https://example.com/og/index.png">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<meta name="twitter:image" content="https://example.com/og/index.png">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<div class="typeset-scroll scrollbar">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<table>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "index.html"),
  '<header><span>index.sh</span>',
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
  '<footer><a class="btn" data-variant="outline" data-size="sm" href="/docs/guide/">More</a></footer>',
);
{
  const html = fs.readFileSync(path.join(appDir, "dist", "docs", "interactive", "index.html"), "utf8");
  for (const value of ["Automatic preview text", "Second automatic element"]) {
    if (html.split(value).length !== 3) throw new Error(`Expected live and source preview content: ${value}`);
  }
  if (!html.includes("Explicit override source")) throw new Error("Missing explicit preview source override");
}

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
  '<header><span>smoke.json</span>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  'data-copy aria-label="Copy code"',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '"fenced"',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<header><span>Command</span>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<div class="typeset-scroll scrollbar">',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<table>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<div class="typeset-scroll"><table><tbody><tr><td>Already wrapped</td></tr></tbody></table></div>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "interactive", "index.html"),
  '<div data-not-typeset="true"><table class="table"><tbody><tr><td>Custom component table</td></tr></tbody></table></div>',
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
  '<span class="min-w-0 truncate">Guide</span>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "guide", "index.html"),
  '<span class="ms-auto inline-flex shrink-0 items-center gap-1"><span class="badge" data-variant="outline">Beta</span>',
);
assertIncludes(
  path.join(appDir, "dist", "docs", "guide", "index.html"),
  "https://example.com/external",
);
assertIncludes(path.join(appDir, "dist", "llms.txt"), "Consumer docs");
assertIncludes(
  path.join(appDir, "dist", "llms.txt"),
  "- [Welcome](https://example.com/docs/index.md)",
);
assertIncludes(
  path.join(appDir, "dist", "llms.txt"),
  "- [Guide](https://example.com/docs/guide.md)",
);
assertIncludes(
  path.join(appDir, "dist", "llms.txt"),
  "- [Interactive](https://example.com/docs/interactive.md)",
);
assertIncludes(
  path.join(appDir, "dist", "llms.txt"),
  "- [Nested](https://example.com/docs/deep/nested.md)",
);

assertIncludes(path.join(appDir, "dist", "docs", "interactive", "index.html"), 'data-size="xs" data-variant="ghost">Read guide</a>');
assertNotIncludes(path.join(appDir, "dist", "docs", "interactive", "index.html"), 'class="tabs-frame"');
assertNotIncludes(path.join(appDir, "dist", "docs", "interactive", "index.html"), 'class="code-frame"');
assertNotIncludes(path.join(appDir, "dist", "docs", "interactive.md"), "<Tabs>");
assertNotIncludes(path.join(appDir, "dist", "docs", "interactive.md"), "<Tab title=");
assertIncludes(path.join(appDir, "dist", "docs", "interactive.md"), "```bash Command\nnpm run build\n```");

assertIncludes(path.join(appDir, "dist", "docs", "interactive", "index.html"), "text-rose-700");

for (const slug of ["index", "interactive/index"]) {
  const html = fs.readFileSync(path.join(appDir, "dist", "docs", `${slug}.html`), "utf8");
  for (const color of ["amber"]) {
    if (!html.includes(`text-${color}-700`) && !html.includes(`text-${color}-600`)) throw new Error(`Missing ${color} alert in ${slug}`);
  }
  for (const title of ["Note", "Tip", "Important", "Warning", "Caution"]) {
    if (!html.includes(`<h3>${title}</h3>`)) throw new Error(`Missing ${title} alert in ${slug}`);
  }
  for (const variant of ["destructive"]) {
    if (!html.includes(`data-variant="${variant}"`)) throw new Error(`Missing ${variant} severity in ${slug}`);
  }
  for (const text of ["Normal quotation.", "[!UNKNOWN]", "same line remains a quote", "Literal code sample.", "<strong>note</strong>", "<li>Nested list item</li>"]) {
    if (!html.includes(text)) throw new Error(`Lost alert content ${text} in ${slug}`);
  }
  const exported = fs.readFileSync(path.join(appDir, "dist", "docs", slug === "index" ? "index.md" : "interactive.md"), "utf8");
  if (!exported.includes("> [!WARNING]")) throw new Error(`Lost alert syntax in ${slug} export`);
}

console.log("Consumer smoke test passed.");
