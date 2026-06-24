# Pages

ReallySimpleDocs renders Markdown and MDX files from `docs/`. Add a page, then add its slug to `docs/docs.json`.

## Create a page

```md title="docs/page-title.md"
# Page title

Page content starts here.
```

Save it as `docs/page-title.md`, then add `"page-title"` to the navigation.

ReallySimpleDocs uses the first H1 as the page title. If there is no H1, it falls back to the slug.

## Write Markdown

Use normal Markdown for headings, lists, tables, links, and fenced code blocks. H2 and H3 headings appear in the “On this page” table of contents.

```md
# Page title

## Section

### Subsection
```

Use fenced code blocks with a language:

````md
```bash
npm run build
```
````

Code blocks get syntax highlighting and copy buttons.

Add `title="..."` after the language for a titled code block:

````md
```js title="astro.config.mjs"
export default {};
```
````

## Use MDX when needed

Use `.mdx` only when a page needs ReallySimpleDocs or Astro components. Markdown remains the default.

```mdx title="docs/page.mdx"
# Page title

<Callout title="MDX works">
  This page uses MDX.
</Callout>
```

Common ReallySimpleDocs components are available by default:

- `Callout`
- `Tabs`
- `Code`
- `CodeGroup`
- `Preview`
- `Steps`
- `Card` and `CardGrid`

## Add media

Put images and downloads in `public/media/`, then reference them with an absolute path:

```md
![Diagram](/media/diagram.png)
```

`public/assets/` is reserved for site assets such as CSS, JavaScript, and favicons.

## Exported Markdown

Each page is also available as Markdown at the same route with `.md` appended. With the default `routeBase: "/docs"`, a page like `docs/pages.md` gets these routes:

```text
/docs/pages/
/docs/pages.md
```

Markdown exports strip MDX imports and convert common ReallySimpleDocs components into portable Markdown for agents and readers.

## Use HTML carefully

Markdown supports inline HTML, including Basecoat markup:

```html
<div class="alert">
  <h3>Alert title</h3>
  <section>
    <p>Alert content here.</p>
  </section>
</div>
```

Prefer MDX components for reusable UI. The legacy `{% raw %}{% lucide "triangle-alert" %}{% endraw %}` shortcode still works, but new pages should use MDX components or inline SVG for custom UI.
