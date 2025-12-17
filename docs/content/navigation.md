---
title: Navigation
description: Configure groups, items, and submenus in `docs/docs.json`.
---

Navigation is defined in `docs/docs.json` under `menu`. This `menu` powers:

- The sidebar menu,
- The command menu (⌘K / Ctrl+K),
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
- Command menu + prev/next flatten the tree to page slugs (in order).

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

### Submenu

| Key | Type | Required | Notes |
|-----|------|----------|------|
| `type` | `"submenu"` | Yes | Submenu container. |
| `label` | `string` | Yes | Label shown in the sidebar. |
| `icon` | `string` | No | Lucide icon name (kebab-case). |
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

Icons are always [**Lucide names**](https://lucide.dev/). They get converted to SVG at build time.

### Page icon

```yaml
---
title: Install
icon: package
---
```

### Submenu icon

```json
{
  "type": "submenu",
  "label": "Manage content",
  "icon": "file-text",
  "items": ["content/index", "content/navigation", "content/pages"]
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
      "items": ["install", "customize", "content/index"]
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
