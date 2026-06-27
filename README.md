# ReallySimpleDocs

A simple documentation system for Astro, built with Basecoat and Tailwind CSS.

ReallySimpleDocs keeps docs portable: content lives in `docs/`, navigation lives in `docs/docs.json`, and the Astro integration owns the docs UI, search, Markdown exports, and LLM files.

## Install

Add ReallySimpleDocs to an Astro site:

```bash
npm install reallysimpledocs basecoat-css@beta tailwindcss
```

Configure the integration:

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import reallySimpleDocs from "reallysimpledocs/astro";

export default defineConfig({
  integrations: [
    reallySimpleDocs({
      docsDir: "./docs",
      routeBase: "/docs",
      style: "vega",
      site: {
        title: "Acme Docs",
        description: "Documentation for Acme.",
        url: "https://docs.example.com",
        favicon: "favicon.svg",
        socialImage: "social.png",
      },
    }),
  ],
});
```

Create your first docs page:

```text
docs/
├── docs.json
└── index.md
```

```json
{
  "menu": [
    {
      "type": "group",
      "label": "Docs",
      "items": [{ "slug": "index", "icon": "info" }]
    }
  ]
}
```

```md
# Introduction

Welcome to the docs.
```

## What it provides

- Static docs routes from Markdown and MDX files.
- Sidebar navigation from `docs/docs.json`.
- Lunr search with a built-in command dialog.
- Syntax-highlighted code blocks with copy buttons.
- `llms.txt`, `llms-full.txt`, and per-page Markdown exports.
- Basecoat styling with style-specific RSD CSS for docs surfaces.
- Component slots for additive head content, sidebar chrome, and header controls.

## Customization

Use `components.ContentHeader` for controls between search and the built-in theme toggle:

```js
reallySimpleDocs({
  components: {
    ContentHeader: "./src/components/ContentHeader.astro",
  },
});
```

Use `components.Head` to add tags to `<head>`. RSD's built-in metadata, theme setup, Basecoat JavaScript, copy-code behavior, and search behavior still render.

Use `customCss` for project CSS imported after Basecoat and RSD styles:

```js
reallySimpleDocs({
  style: "nova",
  customCss: ["./src/docs.css"],
});
```

Use `css: false` only when you provide the full Tailwind/Basecoat/RSD stylesheet pipeline yourself. RSD exports its own CSS for that case:

```css
@import "reallysimpledocs/css";
@import "reallysimpledocs/css/styles/vega";
```

## Search outside docs

Render the exported `CommandDialog` on any Astro page where you want docs search:

```astro
---
import { CommandDialog } from "reallysimpledocs/components";
---

<CommandDialog />

<button type="button" class="btn" onclick="window.rsdOpenCommandSearch?.()">
  Search docs
</button>
```

## Local development

```bash
npm install
npm run dev
```

Useful checks before publishing:

```bash
npm run build
npm pack --dry-run
npm run smoke:consumer
```

`npm run check` runs all three.

## Documentation

Go to [reallysimpledocs.com](https://reallysimpledocs.com).

## Support

- [Report issues](https://github.com/hunvreus/reallysimpledocs/issues)
- [Sponsor me](https://github.com/sponsors/hunvreus)
- [Star the project on GitHub](https://github.com/hunvreus/reallysimpledocs)

## License

[MIT](LICENSE.md)
