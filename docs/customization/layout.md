---
title: Layout
description: Customize the doc layout, header, and sidebar.
---

## Layout files

| File | Purpose |
|------|---------|
| `_includes/layouts/base.njk` | Global HTML shell (meta tags, scripts, CSS). |
| `_includes/layouts/doc.njk` | Docs layout (sidebar, header, content, TOC, prev/next). |
| `_includes/partials/docs/header.njk` | Top bar (search trigger, links, theme toggle). |
| `_includes/partials/docs/sidebar.njk` | Sidebar header and sidebar macro wiring. |

## Per-page head content

You can inject extra head markup via a `head` frontmatter field:

```md
---
title: My page
description: Page description.
head: '<meta name="robots" content="noindex">'
---
```

<div class="flex flex-wrap gap-2 my-6">
  <a href="/customization/style/" class="badge-outline">
    Style
    {% lucide "arrow-right" %}
  </a>
  <a href="/customization/navigation/" class="badge-outline">
    Navigation
    {% lucide "arrow-right" %}
  </a>
</div>
