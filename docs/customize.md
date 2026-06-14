# Customize

## Files

```text
├── docs/       # Content and navigation (in docs.json)
├── public/     # Public assets: favicon, social image, media
└── src/        # Optional custom CSS and component overrides
```

## Astro integration

Configure RSD in `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import reallySimpleDocs from "reallysimpledocs/astro";

export default defineConfig({
  integrations: [
    reallySimpleDocs({
      docsDir: "./docs",
      routeBase: "/docs",
      style: "vega",
      customCss: ["./src/docs.css"],
      components: {
        SidebarHeader: "./src/components/SidebarHeader.astro",
      },
      site: {
        title: "ReallySimpleDocs",
        subtitle: "v1.0.0-beta.2",
        description: "A really simple documentation system.",
        url: "https://example.com",
        assets: {
          favicon: "favicon.svg",
          appleTouchIcon: "apple-touch-icon.png",
          socialImage: "social.png",
        },
        logo: { url: "/favicon.svg" },
        links: [
          {
            label: "GitHub",
            url: "https://github.com/you/project",
            attrs: { target: "_blank", rel: "noopener" },
          },
        ],
      },
    }),
  ],
});
```

| Key | Type | Notes |
|-----|------|------|
| `docsDir` | `string` | Folder containing Markdown pages and `docs.json`. |
| `routeBase` | `string` | URL path where docs are mounted. |
| `style` | `string` | Basecoat style (`vega`, `nova`, `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea`). |
| `customCss` | `string[]` | CSS files imported after RSD and Basecoat styles. |
| `components.SidebarHeader` | `string` | Astro component path for the sidebar header override. |
| `site` | `object` | Site metadata and header links. |
| `title` | `string` | Site title (used in header + `<title>`). |
| `subtitle` | `string` | Optional short line shown under the title in the sidebar (e.g. version or tagline). |
| `description` | `string` | Default meta description. |
| `url` | `string` | Canonical URL (used for LLM exports). |
| `assets.favicon` | `string` | Optional favicon path or URL. Relative values resolve under `assetsBase` (`/assets` by default). |
| `assets.appleTouchIcon` | `string` | Optional Apple touch icon path or URL. Relative values resolve under `assetsBase`. |
| `assets.socialImage` | `string` | Optional social preview image path or URL. Relative values resolve under `assetsBase`. |
| `logo.svg` | `string` | Inline SVG markup for the sidebar logo. |
| `logo.url` | `string` | Image URL (alternative to `logo.svg`). |
| `links[]` | `array` | Header links. |
| `links[].label` | `string` | Link label (used for tooltips and mobile; shown on desktop when `iconOnly` is `false`). |
| `links[].iconOnly` | `boolean` | Desktop-only: render as icon button. |
| `links[].icon` | `string` | Lucide icon name or inline SVG markup. |
| `links[].url` | `string` | Link destination. |
| `links[].attrs` | `object` | Extra attributes (`target`, `rel`, …). |

## Sidebar header

Override the sidebar header with an Astro component:

```js
reallySimpleDocs({
  components: {
    SidebarHeader: "./src/components/SidebarHeader.astro",
  }
});
```

The component receives `site` as a prop:

```astro
---
const { site } = Astro.props;
---

<a href="/" class="btn-ghost h-12 w-full justify-start p-2">
  {site.title}
</a>
```

<div class="alert">
  {% lucide "triangle-alert" %}
  <h3>Keep custom pages in Astro</h3>
  <section>
    <p>RSD owns the docs route tree. Add landing pages, pricing pages, blogs, and app pages with normal Astro routes.</p>
  </section>
</div>

## Styles

<div class="alert">
  {% lucide "info" %}
  <h3>Use any Basecoat style</h3>
  <section>
    <p>ReallySimpleDocs is built with [Basecoat](https://basecoatui.com). Pick a Basecoat style in the integration config and override CSS variables in custom CSS.</p>
  </section>
</div>

Use `customCss` to import CSS after RSD and Basecoat styles:

```css
:root {
  --primary: oklch(54.6% 0.245 262.881);
}

.dark {
  --primary: oklch(70.7% 0.165 254.624);
}
```

Astro watches these files and rebuilds them during development.

## Basecoat outside docs

RSD owns the generated docs pages. If your Astro site also has custom pages, such as a landing page at `/`, use Basecoat directly in your own Astro layout.

Create a stylesheet for the rest of the site:

```css
@import "tailwindcss";
@import "basecoat-css/base";
@import "basecoat-css/styles/vega";

@source "../src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}";
```

Then import it with Basecoat's JavaScript in the layout used by your custom pages:

```astro
---
import "../styles/site.css";
import "basecoat-css/all.min";
---

<slot />
```

Use the same Basecoat style name in both places:

```js
reallySimpleDocs({
  routeBase: "/docs",
  style: "vega",
});
```

## Assets

The `public/assets/` folder contains public files served at `/assets/*`. RSD does not emit favicon or social-image tags unless you configure them under `site.assets`.

| Path | Notes |
|------|------|
| `public/assets/favicon.svg` | Favicon when `site.assets.favicon` is `"favicon.svg"`. |
| `public/assets/apple-touch-icon.png` | Apple touch icon when `site.assets.appleTouchIcon` is `"apple-touch-icon.png"`. |
| `public/assets/social.png` | Social preview image when `site.assets.socialImage` is `"social.png"`. |

Media files you insert in content should go in `public/media/` and be referenced with `/media/...`.

## Search

Search uses a generated Lunr index. RSD extracts each page title from the first H1 and indexes the remaining Markdown body.
