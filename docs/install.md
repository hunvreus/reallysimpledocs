# Install

## Add RSD to Astro

1. Install the integration, Basecoat, and Tailwind CSS:
    ```bash
    npm install reallysimpledocs@beta basecoat-css@beta tailwindcss
    ```
2. Add RSD to `astro.config.mjs`:
    ```js
    import { defineConfig } from "astro/config";
    import reallySimpleDocs from "reallysimpledocs/astro";

    export default defineConfig({
      integrations: [
        reallySimpleDocs({
          docsDir: "./docs",
          routeBase: "/docs",
          site: {
            title: "My docs",
            description: "Documentation for my project.",
          },
        }),
      ],
    });
    ```
3. Create `docs/docs.json`:
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
4. Create `docs/index.md`:
    ```md
    # Introduction

    Welcome to the docs.
    ```
5. Start the dev server:
    ```bash
    npm run dev
    ```
6. Open the site at the URL printed by Astro.

You can then [customize your site](/customize/) and [write docs](/content/pages/).

Markdown is the default content format. Use `.mdx` when a page needs RSD components. Common RSD components are available by default, so page-level imports are not required.

## Deploy

Build the site with `npm run build` and upload `dist/` to a static host:

- [Cloudflare Pages](https://pages.cloudflare.com)
- [GitHub Pages](https://docs.github.com/en/pages)
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)

## Upgrade

RSD is an Astro integration. Upgrade it through your package manager:

```bash
npm install reallysimpledocs@beta basecoat-css@beta tailwindcss
```

Keep your project-owned content and config:

| Path | Purpose |
|------|---------|
| `docs/` | Markdown content. |
| `docs/docs.json` | Navigation. |
| `astro.config.mjs` | Integration config, site metadata, and header links. |
| `public/media/` | Images and files used by docs content. |
| `src/docs.css` | Optional custom CSS imported with `customCss`. |

For custom pages outside the docs route, load Basecoat directly in your own Astro layout. See [Customize](/customize/#basecoat-outside-docs).
