---
title: Theme
description: Customize Tailwind + Basecoat styles for your docs site.
---

## Where styles live

- Tailwind entrypoint: `src/css/styles.css`
- Built CSS output: `assets/styles.css`

## Edit styles

```bash
npm run dev
```

Tailwind rebuilds automatically in dev.

## Code blocks

- Highlighting: `highlight.js` is loaded in `_includes/layouts/base.njk`.
- Copy button: injected by `assets/copy-code.js` and styled via `.code-copy-button` in `src/css/styles.css`.

<div class="flex flex-wrap gap-2 my-6">
  <a href="/content/code/" class="badge-outline">
    Code
    {% lucide "arrow-right" %}
  </a>
</div>
