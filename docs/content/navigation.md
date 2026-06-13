# Navigation

Navigation is defined in `docs/docs.json` under `menu`. This `menu` powers:

- The sidebar menu,
- The search index,
- Previous and next links on each page.

## Schema

`menu` is an array of **groups**. Groups contain **items**. Items can be page slugs or **submenus**.

## How nesting works

Think of `menu` as a tree:

```text
menu[]
└─ group
   └─ items[]
      ├─ "page-slug"
      └─ submenu
         └─ items[]
            ├─ "page-slug"
            └─ submenu (nested)
               └─ items[] …
```

Rules:

- **Groups** only exist at the top level (`menu[]`).
- A group `items[]` can contain **page slugs** and **submenus**.
- A submenu `items[]` can contain **page slugs** and **submenus** (recursive).

The UI is derived from that structure:

- Sidebar renders the tree as-is.
- Search, previous links, and next links flatten the tree to page slugs (in order).

### Group

| Key | Type | Required | Notes |
|-----|------|----------|------|
| `type` | `"group"` | Yes | Group container. |
| `label` | `string` | No | Sidebar section title. |
| `items` | `array` | Yes | Page slugs and submenus. |

### Item (page)

| Shape | Type | Notes |
|------|------|------|
| `"content/pages"` | `string` | Slug (path without `.md`). |
| `{ "slug": "content/pages", "icon": "fileText" }` | `object` | Page slug with a sidebar icon. |

### Submenu

| Key | Type | Required | Notes |
|-----|------|----------|------|
| `type` | `"submenu"` | Yes | Submenu container. |
| `label` | `string` | Yes | Label shown in the sidebar. |
| `icon` | `string` | No | Lucide icon name (`fileText` or `file-text`). |
| `open` | `boolean` | No | Default open state. |
| `items` | `array` | Yes | Page slugs or nested submenus. |

<div class="alert">
  {% lucide "triangle-alert" %}
  <h3>Use slugs, not file names</h3>
  <section>
    <p>Use the path without <code>.md</code>. Example: <code>docs/content/pages.md</code> becomes <code>"content/pages"</code>.</p>
  </section>
</div>

## Icons

Icons are [Lucide names](https://lucide.dev/). Use camelCase or kebab-case. They get converted to SVG at build time.

```json
{
  "slug": "content/pages",
  "icon": "fileText"
}
```

## Example

```json
{
  "menu": [
    { "type": "group", "label": "Overview", "items": ["index"] },
    {
      "type": "group",
      "label": "Getting started",
      "items": [
        { "slug": "install", "icon": "package" },
        { "slug": "customize", "icon": "slidersVertical" },
        "content/index"
      ]
    },
    {
      "type": "submenu",
      "label": "Manage content",
      "icon": "file-text",
      "open": true,
      "items": [
        "content/navigation",
        {
          "type": "submenu",
          "label": "Writing",
          "icon": "pencil",
          "items": ["content/pages"]
        }
      ]
    }
  ]
}
```
