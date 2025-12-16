---
title: Custom HTML
description: Use HTML and Nunjucks snippets for richer layouts.
---

Markdown supports inline HTML. This template also enables Nunjucks in Markdown, so you can use shortcodes and includes.

## Cards

```html
<div class="border rounded-lg p-4">
  <h3 class="font-medium">Card title</h3>
  <p class="text-muted-foreground text-sm">Card content.</p>
</div>
```

## Alert blocks

```html
<div class="alert">
  {% raw %}{% lucide "triangle-alert" %}{% endraw %}
  <h3>Alert title</h3>
  <section>
    <p>Alert content here.</p>
  </section>
</div>
```