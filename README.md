# ReallySimpleDocs

A simple documentation system for Astro, built with **Basecoat** and **Tailwind CSS**.

RSD keeps docs portable: content lives in `docs/`, navigation lives in `docs/docs.json`, and the Astro integration owns the docs UI.

## Add to an Astro site

```bash
npm install reallysimpledocs@beta basecoat-css@beta
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

RSD injects docs pages, Lunr search, per-page Markdown exports, `llms.txt`, and `llms-full.txt`.

## Local development (this repo)

```bash
npm install
npm run dev
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
