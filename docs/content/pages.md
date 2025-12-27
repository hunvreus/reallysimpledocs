---
title: Pages
description: Frontmatter, Markdown, code blocks, media, and Basecoat components.
---

## Frontmatter

Each page should include `title` and `description`. Optionally, you can define an `icon` if you want it to show an icon in the [sidebar menu](/navigation):

```yml
---
title: Page title
description: Short summary for search and previews.
icon: file-text # Optional
---
```

## Markdown

Use normal Markdown (headings, lists, tables, links). Headings power the “On this page” TOC.

```md
## Section
### Subsection
```

## Code

Use fenced code blocks with a language:

```bash
npm run build
```

Code blocks get:

- Syntax highlighting (Shiki, build-time)
- A **Copy** button

## Media

Put media (images, downloads) in `media/` and reference them with an absolute path:

```md
![Diagram](/media/diagram.png)
```

`assets/` is reserved for public site assets (CSS, JS, favicon, etc).

## HTML, Nunjucks and Components

Markdown supports inline HTML as well as Nunjucks code.

For example you can use `{% raw %}{% lucide "triangle-alert" %}{% endraw %}` to insert an icon.

You can also use any of the [Basecoat](https://basecoatui.com) components. For example the [Alert compomnent](https://basecoatui.com/components/alert/):

```njk
<div class="alert">
  {% raw %}{% lucide "triangle-alert" %}{% endraw %}
  <h3>Alert title</h3>
  <section>
    <p>Alert content here.</p>
  </section>
</div>
```