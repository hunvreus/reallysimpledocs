---
title: Overview
description: Overview of writing docs in Markdown, with optional HTML and components.
---

Docs content lives in `docs/` and is written in Markdown.

## Page structure

Each page should have frontmatter:

```md
---
title: Page title
description: Short summary for search and previews.
---
```

## What you can use

| Feature | Notes |
|--------|------|
| Markdown | Headings, lists, tables, links |
| Code blocks | Syntax highlighting + copy button |
| Icons | Use the `lucide` shortcode. |
| Components | Alert blocks, badges, and custom HTML |
| LLM exports | `llms.txt`, `llms-full.txt`, and per-page `/*.md` |

Example:

```njk
{% raw %}{% lucide "arrow-right" %}{% endraw %}
```

## Where files go

| What | File |
|------|------|
| Markdown pages | `docs/**/*.md` |
| Public assets | `assets/` |
| LLM exports | `docs/llms*.11ty.js`, `docs/raw-md.11ty.js` |

<div class="flex flex-wrap gap-2 my-6">
  <a href="/content/markdown/" class="badge-outline">
    Markdown
    {% lucide "arrow-right" %}
  </a>
  <a href="/content/code/" class="badge-outline">
    Code
    {% lucide "arrow-right" %}
  </a>
  <a href="/content/icons/" class="badge-outline">
    Icons
    {% lucide "arrow-right" %}
  </a>
  <a href="/content/media/" class="badge-outline">
    Media
    {% lucide "arrow-right" %}
  </a>
  <a href="/content/html/" class="badge-outline">
    Custom HTML
    {% lucide "arrow-right" %}
  </a>
  <a href="/content/llms/" class="badge-outline">
    LLMs
    {% lucide "arrow-right" %}
  </a>
</div>
