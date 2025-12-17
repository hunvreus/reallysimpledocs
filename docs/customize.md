---
title: Customize
description: Configure the site, templates, and styles.
icon: sliders-vertical
---

## Files

```text
├── _data/      # Data files, including the site config (site.json)
├── _includes/  # Layouts, macros, partials
├── assets/     # Public assets: CSS, JS, favicon, etc
├── docs/       # Content and navigation (in docs.json)
├── media/      # Media files: images, attachments, etc
└── src/        # Build sources (Tailwind + Eleventy helpers)
```

## Site config

The site metadata, including the header links, live in `_data/site.json`:

| Key | Type | Notes |
|-----|------|------|
| `title` | `string` | Site title (used in header + `<title>`). |
| `subtitle` | `string` | Optional short line shown under the title in the sidebar (e.g. version or tagline). |
| `description` | `string` | Default meta description. |
| `url` | `string` | Canonical URL (used for LLM exports). |
| `logo.svg` | `string` | Inline SVG markup for the sidebar logo. |
| `logo.url` | `string` | Image URL (alternative to `logo.svg`). |
| `links[]` | `array` | Header links. |
| `links[].label` | `string` | Link label (used for tooltips and mobile; shown on desktop when `iconOnly` is `false`). |
| `links[].iconOnly` | `boolean` | Desktop-only: render as icon button. |
| `links[].icon` | `string` | Inline SVG markup for the icon. |
| `links[].url` | `string` | Link destination. |
| `links[].attrs` | `object` | Extra attributes (`target`, `rel`, …). |

## Templates

Templates live in `_includes/`:

| File | Purpose |
|------|---------|
| `_includes/layouts/base.njk` | Global HTML shell (meta tags, CSS/JS). |
| `_includes/layouts/doc.njk` | Docs layout (sidebar, header, content, table of contents). |
| `_includes/partials/docs/header.njk` | Top bar (search trigger, links, theme toggle). |
| `_includes/partials/docs/sidebar.njk` | Sidebar header wiring. |

<div class="alert">
  {% lucide "triangle-alert" %}
  <h3>Avoid touching the macros</h3>
  <section>
    <p>The macros in <code>_includes/macros</code> are from <a href="https://basecoatui.com">Basecoat</a>. Avoid modifying them unless you know what you're doing.</p>
  </section>
</div>

## Styles

<div class="alert">
  {% lucide "info" %}
  <h3>Use any shadcn/ui theme</h3>
  <section>
    <p>ReallySimpleDocs is built with [Basecoat](https://basecoatui.com) which [supports any shadcn/ui theme](https://basecoatui.com/installation/#install-theming).</p>
  </section>
</div>

Tailwind compiles `src/css/styles.css` into `assets/styles.css`. If you want to add custom styles, add them to `src/css/overrides.css`:

| File | Purpose |
|------|---------|
| `src/css/styles.css` | Tailwind entry + source scanning + imports. |
| `src/css/custom.css` | Default content styling (prose, headings, tables). |
| `src/css/highlight.css` | Syntax highlighting theme. |
| `src/css/overrides.css` | Your overrides (loaded last). |

## Assets

The `assets/` folder contains public files served at `/assets/*`.

| Path | Notes |
|------|------|
| `assets/styles.css` | Built output. Don’t edit directly (edit `src/css/*`). |
| `assets/basecoat.min.js` | Copied from `basecoat-css` during `npm run dev`/`npm run build`. |
| `assets/copy-code.js` | Copy button behavior for code blocks. |
| `assets/favicon.svg` | Default favicon. Replace to customize. |

Media files (e.g. images your insert in the content) should go in the `media/` folder.

## Search

The search is currently built from the same `menu` as [navigation](/content/navigation/), relying on the `title` and `description` of each entry for matching the keywords.
