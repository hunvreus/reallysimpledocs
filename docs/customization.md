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
| `style` | `"vega"` | Basecoat style: `vega`, `nova`, `maia`, `lyra`, `mira`, `luma`, `sera`, or `rhea`. |
| `customCss` | `[]` | CSS files imported after Basecoat and ReallySimpleDocs styles. |
| `css` | `true` | Set to `false` when you provide the full CSS pipeline yourself. |
| `components.Head` | Empty | Astro component appended to the document `<head>`. |
| `components.SidebarHeader` | Default header | Astro component used for the sidebar header. |
| `components.SidebarFooter` | Empty footer | Astro component used for the sidebar footer. |
| `components.ContentHeader` | Empty | Astro component rendered between search and the built-in theme toggle. |
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

Use `Head` to add scripts, styles, preload tags, or site-specific metadata to the document `<head>`.
The default RSD head scripts and metadata still render.

```astro
<script src="/assets/docs.js" defer></script>
```

`Head` receives `config`, `site`, `title`, `description`, `pagePath`, `metaTitle`, and `absoluteUrl`.

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

Use `ContentHeader` for controls between search and the built-in theme toggle.
Header actions, such as a GitHub link, belong in this component rather than in `site` metadata.

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

ReallySimpleDocs is built on [Basecoat](https://basecoatui.com). Pick a Basecoat style with `style`, then add project-specific CSS with `customCss`:

```js
reallySimpleDocs({
  style: "nova",
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

## Managed CSS

Disable managed CSS only when you want to own the full stylesheet pipeline:

```js
reallySimpleDocs({
  css: false,
});
```

With managed CSS enabled, ReallySimpleDocs inserts:

- Tailwind
- the selected Basecoat style
- RSD layout/component CSS
- each `customCss` file

Use `css: false` when you bring your own Tailwind/Basecoat/RSD stylesheet.

ReallySimpleDocs always inserts its managed JavaScript: theme initialization, Basecoat JavaScript, copy-code behavior, and command search behavior.

When you disable managed CSS, use these source files as references for what you may need to reproduce:

- [DefaultHead.astro](https://github.com/hunvreus/reallysimpledocs/blob/main/src/runtime/components/DefaultHead.astro): theme initialization, Basecoat JavaScript, and copy-code behavior.
- [ThemeToggle.astro](https://github.com/hunvreus/reallysimpledocs/blob/main/src/runtime/components/ThemeToggle.astro): built-in dark-mode button.
- [CommandDialog.astro](https://github.com/hunvreus/reallysimpledocs/blob/main/src/runtime/components/CommandDialog.astro): search dialog behavior.
- [Sidebar.astro](https://github.com/hunvreus/reallysimpledocs/blob/main/src/runtime/components/Sidebar.astro): sidebar shell and mobile toggle target.
- [custom.css](https://github.com/hunvreus/reallysimpledocs/blob/main/src/css/custom.css) and [overrides.css](https://github.com/hunvreus/reallysimpledocs/blob/main/src/css/overrides.css): RSD-specific CSS layered on top of Basecoat.

Prefer `style` and `customCss` for normal styling changes, and `Head` or `ContentHeader` for additive UI. Use `css: false` only when you are replacing RSD's stylesheet pipeline.

## Public files

Put docs media in `public/media/` and reference it with absolute paths:

```md
![Diagram](/media/diagram.png)
```

Put favicon and social assets in `public/assets/` when using the default `assetsBase`.

## Search

Search uses a generated Lunr index. ReallySimpleDocs indexes normalized Markdown, including fallback Markdown for known MDX components, while keeping code examples separate so prose matches stay readable.
