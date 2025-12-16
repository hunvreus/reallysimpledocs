---
title: Architecture
description: How the site is built and where things live.
icon: boxes
---

## Stack

| Piece | What it does | Where it is |
|------|---------------|-------------|
| **Eleventy (11ty)** | Builds pages from Markdown + templates | `.eleventy.js`, `docs/` |
| **Nunjucks** | Layouts, partials, and macros | `_includes/` |
| **Tailwind CSS** | Site styling | `src/styles.css` → `assets/styles.css` |
| **Basecoat** | UI components + JS init system | `assets/basecoat.min.js` |
| **highlight.js** | Syntax highlighting | `_includes/layouts/base.njk` |

## Build pipeline

1. Tailwind compiles `src/styles.css` to `assets/styles.css`.
2. Basecoat is copied into `assets/`.
3. Eleventy renders `docs/**/*.md` with layouts from `_includes/layouts/`.

## File structure

```text
.
├── _data/
│   └── site.json              # Site metadata (title, description, url)
├── _includes/
│   ├── layouts/               # Base + doc layout
│   ├── partials/              # Header/sidebar glue
│   └── macros/                # Reusable components (sidebar, dropdown, ...)
├── assets/                    # Built CSS + JS + static files (passthrough)
├── docs/                      # Markdown content + docs/docs.json menu
└── src/
    └── styles.css             # Tailwind entrypoint
```

<div class="flex flex-wrap gap-2 my-6">
  <a href="/customization/layout/" class="badge-outline">
    Layout
    {% lucide "arrow-right" %}
  </a>
  <a href="/customization/navigation/" class="badge-outline">
    Navigation
    {% lucide "arrow-right" %}
  </a>
</div>
