---
title: Search
description: Search is implemented as a command menu built from the docs `menu`.
---

Search uses a command dialog (open with **⌘K** / **Ctrl+K**).

## How it works

- Items are generated from `docs/docs.json` `menu`.
- Labels come from each page frontmatter `title`.
- Keywords are built from `title` + `description`.

## Improve results

- Keep `title` short and specific.
- Use `description` to add extra keywords users might type.

## Roadmap

This is not full-text search. A future version can add Lunr.js (or similar) for indexing page content.

<div class="flex flex-wrap gap-2 my-6">
  <a href="/customization/navigation/" class="badge-outline">
    Navigation
    {% lucide "arrow-right" %}
  </a>
  <a href="/content/markdown/" class="badge-outline">
    Markdown
    {% lucide "arrow-right" %}
  </a>
</div>
