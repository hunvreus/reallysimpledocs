# Pages

## Title

Each page is a Markdown or MDX file. Put one H1 at the top. RSD uses it as the page title:

```md
# Page title

Page content starts here.
```

## Markdown

Use normal Markdown (headings, lists, tables, links). Headings power the “On this page” TOC.

```md
# Page title

## Section
### Subsection
```

## MDX

Use `.mdx` only when a page needs RSD or Astro components. Markdown remains the default format. Common RSD components are available by default, so page-level imports are not required.

```mdx
# Page title

<Callout type="tip">
  This page uses MDX.
</Callout>
```

RSD ships a small component set for MDX pages:

- `Callout`
- `Tabs`
- `Code`
- `CodeGroup`
- `Preview`
- `Steps`
- `Card` and `CardGrid`
- `Badge`
- `LinkButton`

## Code

Use fenced code blocks with a language:

```bash
npm run build
```

Code blocks get:

- Syntax highlighting (Shiki)
- A **Copy** button

## Media

Put media (images, downloads) in `public/media/` and reference them with an absolute path:

```md
![Diagram](/media/diagram.png)
```

`public/assets/` is reserved for public site assets (CSS, JS, favicon, etc).

## HTML and Components

Markdown supports inline HTML.

You can also use any of the [Basecoat](https://basecoatui.com) components. For example the [Alert component](https://basecoatui.com/components/alert/):

```njk
<div class="alert">
  <h3>Alert title</h3>
  <section>
    <p>Alert content here.</p>
  </section>
</div>
```

RSD still supports the legacy `{% raw %}{% lucide "triangle-alert" %}{% endraw %}` shortcode while the Astro port settles. Prefer inline SVG or exported Astro components for new advanced UI.
