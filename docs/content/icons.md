---
title: Icons
description: Use Lucide icons in Markdown and Nunjucks templates.
---

This template uses Lucide via `eleventy-plugin-lucide-icons`.

## Use an icon

Render an icon with the `lucide` shortcode:

```jinja
{% raw %}{% lucide "arrow-right" %}{% endraw %}
```

## Add classes and attributes

Pass attributes as the second argument:

```jinja
{% raw %}{% lucide "search", { class: "size-4 text-muted-foreground", "aria-hidden": "true" } %}{% endraw %}
```

## Find icon names

Use the Lucide icon name (kebab-case), like `triangle-alert`, `panel-left`, or `table-of-contents`.

## Where icons are used

| Location | Example |
|----------|---------|
| Alert blocks | `{% lucide "triangle-alert" %}` |
| Badges/links | `{% lucide "arrow-right" %}` |
| Header actions | `{% lucide "search" %}`, `{% lucide "moon" %}` |

<div class="flex flex-wrap gap-2 my-6">
  <a href="/content/html/" class="badge-outline">
    Custom HTML
    {% lucide "arrow-right" %}
  </a>
  <a href="/customization/layout/" class="badge-outline">
    Layout
    {% lucide "arrow-right" %}
  </a>
</div>
