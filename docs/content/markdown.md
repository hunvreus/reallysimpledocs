---
title: Markdown
description: Write pages with Markdown, frontmatter, and optional HTML.
---

## Frontmatter

Every page needs a `title` and `description`:

```yaml
---
title: My page
description: What this page covers.
---
```

## Headings

Use `##` for page sections. The layout renders an “On this page” table of contents from headings.

```md
## Section
### Subsection
```

## Links

Use absolute site paths for internal links:

```md
[Getting started](/getting-started/)
```

## Tables

Tables are supported and automatically wrapped in a scroll container.

```md
| Key | Description |
|-----|-------------|
| `site.url` | Canonical site URL (set in `_data/site.json`). |
```

## Alert blocks

Use alert blocks for important context:

```njk
<div class="alert">
  {% lucide "triangle-alert" %}
  <h3>Alert title</h3>
  <section>
    <p>Alert content here.</p>
  </section>
</div>
```

## Contextual links

Add related links at the end of a section:

```njk
<div class="flex flex-wrap gap-2 my-6">
  <a href="/customization/navigation/" class="badge-outline">
    Navigation
    {% lucide "arrow-right" %}
  </a>
</div>
```

## Inline HTML

Markdown supports inline HTML. This template also enables Nunjucks in Markdown, so you can use shortcodes like `{% lucide "arrow-right" %}`.

<div class="flex flex-wrap gap-2 my-6">
  <a href="/content/html/" class="badge-outline">
    Custom HTML
    {% lucide "arrow-right" %}
  </a>
  <a href="/content/icons/" class="badge-outline">
    Icons
    {% lucide "arrow-right" %}
  </a>
</div>

<div class="flex flex-wrap gap-2 my-6">
  <a href="/content/code/" class="badge-outline">
    Code
    {% lucide "arrow-right" %}
  </a>
</div>
