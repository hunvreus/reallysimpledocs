# ReallySimpleDocs

A simple documentation system for Astro, built with **Basecoat** and **Tailwind CSS**.

ReallySimpleDocs keeps docs portable: content lives in `docs/`, navigation lives in `docs/docs.json`, and the Astro integration owns the docs UI.

## Add to an Astro site

ReallySimpleDocs is an Astro integration. Add it to an existing Astro site, or create one first with `npm create astro@latest`.

```bash
npm install reallysimpledocs basecoat-css tailwindcss
```

Add the integration:

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
      customCss: ["./src/docs.css"],
      site: {
        title: "ReallySimpleDocs",
        description: "A simple documentation system for Astro.",
      },
    }),
  ],
});
```

Create docs:

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

ReallySimpleDocs injects docs pages, Lunr search, per-page Markdown exports, `llms.txt`, and `llms-full.txt`.

Use component overrides for layout chrome such as sidebar branding, extra head tags, or header controls between search and the built-in theme toggle:

```js
reallySimpleDocs({
  components: {
    ContentHeader: "./src/components/ContentHeader.astro",
  },
});
```

For example, put only the GitHub button in `ContentHeader`; the theme toggle stays built in.

Use `.mdx` when a page needs ReallySimpleDocs components. Common components are available by default, so you do not need to import them in each page:

```mdx
# Button

<Callout title="MDX works">MDX is optional. Plain Markdown stays the default.</Callout>
```

## Use Basecoat outside the docs

By default, ReallySimpleDocs manages one Tailwind/Basecoat stylesheet for the app. It scans `src/`, `docs/`, and the ReallySimpleDocs runtime, so Basecoat and Tailwind classes used by custom Astro pages outside the docs route are included in the same CSS build.

Disable managed CSS only when you want to provide the full stylesheet pipeline yourself:

```js
reallySimpleDocs({
  css: false,
});
```

Use `css: false` when you bring your own Tailwind/Basecoat/RSD stylesheet. ReallySimpleDocs still provides its managed JavaScript.

## Local development (this repo)

```bash
npm install
npm run dev
```

Useful checks before publishing changes:

```bash
npm run build
npm pack --dry-run
npm run smoke:consumer
```

## Documentation

Go to [ReallySimpleDocs.com](https://reallysimpledocs.com).

## Support the project 

- [Contribute code](/CONTRIBUTING.md)
- [Report issues](https://github.com/hunvreus/reallysimpledocs/issues)
- [Sponsor me](https://github.com/sponsors/hunvreus)
- [Star the project on GitHub](https://github.com/hunvreus/reallysimpledocs)

## License

[MIT](/LICENSE.md)
