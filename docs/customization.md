# Customization

## Configuration

Configure ReallySimpleDocs in `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import reallySimpleDocs from "reallysimpledocs/astro";

export default defineConfig({
  integrations: [
    reallySimpleDocs({
      docsDir: "./docs",
      routeBase: "/docs",
      customCss: ["./src/docs.css"],
      site: {
        title: "Acme Docs",
        subtitle: "v1.0.0",
        description: "Documentation for Acme.",
        url: "https://docs.example.com",
      },
    }),
  ],
});
```

| Option | Default | Notes |
|--------|---------|-------|
| `docsDir` | `"./docs"` | Folder containing Markdown or MDX pages and `docs.json`. |
| `routeBase` | `"/docs"` | URL path where the docs are mounted. Use `"/"` for root docs. |
| `customCss` | `[]` | CSS files imported after Basecoat and ReallySimpleDocs styles. |
| `css` | `true` | Set to `false` when you provide the full CSS pipeline yourself. |
| `js` | `true` | Set to `false` when you provide Basecoat and ReallySimpleDocs scripts yourself. |
| `components.Head` | Default head scripts | Astro component rendered in the document `<head>`. |
| `components.SidebarHeader` | Default header | Astro component used for the sidebar header. |
| `components.SidebarFooter` | Empty footer | Astro component used for the sidebar footer. |
| `components.ContentHeader` | Theme toggle | Astro component used for the right side of the sticky content header. |
| `site` | `{}` | Site metadata used by layout, SEO tags, and default UI. |

## Site metadata

`site` controls the default sidebar header, document titles, and metadata:

```js
reallySimpleDocs({
  site: {
    title: "Acme Docs",
    subtitle: "v1.0.0",
    description: "Documentation for Acme.",
    url: "https://docs.example.com",
    assets: {
      favicon: "favicon.svg",
      appleTouchIcon: "apple-touch-icon.png",
      socialImage: "social.png",
    },
    logo: {
      url: "/assets/favicon.svg",
    },
    repository: {
      url: "https://github.com/acme/project",
    },
  },
});
```

Relative asset values resolve from `assetsBase`, which defaults to `/assets`.

## Component overrides

Override layout regions when the default docs shell is not enough:

```js
reallySimpleDocs({
  components: {
    Head: "./src/docs/Head.astro",
    SidebarHeader: "./src/components/SidebarHeader.astro",
    SidebarFooter: "./src/components/SidebarFooter.astro",
    ContentHeader: "./src/components/ContentHeader.astro",
  },
});
```

### Head

Use `Head` for scripts, styles, or preload tags that must render in the document `<head>`.

```astro
---
const { enableJs } = Astro.props;
---

{enableJs && <script src="/assets/docs.js" defer></script>}
```

`Head` receives `config`, `site`, `title`, `description`, `pagePath`, `metaTitle`, `absoluteUrl`, and `enableJs`.

### SidebarHeader

Use `SidebarHeader` when the default logo/title block is not enough.

```astro
---
const { site } = Astro.props;
---

<a href="/" class="btn" data-variant="ghost">
  {site.title}
</a>
```

### SidebarFooter

Use `SidebarFooter` for persistent sidebar actions or secondary links.

```astro
<div class="p-2 text-xs text-muted-foreground">
  v1.0.0
</div>
```

### ContentHeader

Use `ContentHeader` for controls on the right side of the sticky page header.

```astro
<nav class="hidden items-center gap-2 sm:flex">
  <a class="btn" data-variant="outline" data-size="sm" href="https://github.com/acme/project">
    GitHub
  </a>
</nav>
```

`ContentHeader` receives `site` and `page`.

Custom landing pages, marketing pages, blogs, and app pages should stay as normal Astro routes outside the ReallySimpleDocs docs route.

## CSS and Basecoat

ReallySimpleDocs is built on [Basecoat](https://basecoatui.com). Add project-specific CSS with `customCss`:

```js
reallySimpleDocs({
  customCss: ["./src/docs.css"],
});
```

```css
:root {
  --primary: oklch(54.6% 0.245 262.881);
}

.dark {
  --primary: oklch(70.7% 0.165 254.624);
}
```

By default, ReallySimpleDocs manages one Tailwind/Basecoat stylesheet for the app. It scans:

- `src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}`
- `docs/**/*.{md,mdx}`
- ReallySimpleDocs runtime components

That means custom Astro pages outside the docs route can use Tailwind and Basecoat classes without a separate stylesheet.

## Managed CSS and JS

Disable managed CSS or JavaScript only when you want to own the full pipeline:

```js
reallySimpleDocs({
  css: false,
  js: false,
});
```

Use `css: false` when you bring your own Tailwind/Basecoat build. Use `js: false` when you bring your own Basecoat initialization and ReallySimpleDocs behavior scripts.

## Public files

Put docs media in `public/media/` and reference it with absolute paths:

```md
![Diagram](/media/diagram.png)
```

Put favicon and social assets in `public/assets/` when using the default `assetsBase`.

## Search

Search uses a generated Lunr index. ReallySimpleDocs indexes normalized Markdown, including fallback Markdown for known MDX components, while keeping code examples separate so prose matches stay readable.
