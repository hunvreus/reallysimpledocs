---
title: Overview
description: Overview of navigation, layout, search, and styles.
---

Customization is split into a few simple layers.

## Navigation

`docs/docs.json` is the single source of truth for docs navigation.

It drives:

- Sidebar structure
- Command menu items (search)
- Prev/next navigation

## Layout

The docs layout is composed from a few templates.

| Area | File |
|------|------|
| HTML shell (meta + scripts) | `_includes/layouts/base.njk` |
| Docs layout | `_includes/layouts/doc.njk` |
| Top bar | `_includes/partials/docs/header.njk` |
| Sidebar container | `_includes/partials/docs/sidebar.njk` |
| Sidebar renderer | `_includes/macros/sidebar.njk` |

## Styles

Styles are compiled from `src/styles.css` into `assets/styles.css`.

Basecoat provides component primitives. Tailwind styles the site and content.

<div class="flex flex-wrap gap-2 my-6">
  <a href="/customization/navigation/" class="badge-outline">
    Navigation
    {% lucide "arrow-right" %}
  </a>
  <a href="/customization/layout/" class="badge-outline">
    Layout
    {% lucide "arrow-right" %}
  </a>
  <a href="/customization/search/" class="badge-outline">
    Search
    {% lucide "arrow-right" %}
  </a>
  <a href="/customization/style/" class="badge-outline">
    Style
    {% lucide "arrow-right" %}
  </a>
</div>
