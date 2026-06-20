# Navigation

Navigation lives in `docs/docs.json`. It controls:

- the sidebar,
- the command search menu,
- previous and next page links,
- `llms.txt`, `llms-full.txt`, and search ordering.

## Create a menu

Start with one top-level group:

```json
{
  "menu": [
    {
      "type": "group",
      "label": "Docs",
      "items": [
        { "slug": "index", "icon": "info" },
        { "slug": "install", "label": "Quickstart", "icon": "download" },
        "pages"
      ]
    }
  ]
}
```

Use slugs, not file names. For example, `docs/pages.md` becomes `"pages"`.

## Add sections

Think of `menu` as a tree:

```text
menu[]
└─ group
   └─ items[]
      ├─ "page-slug"
      └─ submenu
         └─ items[]
            ├─ "page-slug"
            └─ submenu
```

Groups only exist at the top level. Submenus can be nested inside groups or other submenus.

```json
{
  "type": "submenu",
  "label": "Writing",
  "icon": "pencil",
  "open": true,
  "items": [
    "navigation",
    "pages"
  ]
}
```

## Customize items

Use a string when the page title is enough:

```json
"pages"
```

Use an object when you need a label, icon, badge, or attributes:

```json
{
  "slug": "install",
  "label": "Quickstart",
  "icon": "download",
  "badge": "New"
}
```

Icons are [Lucide](https://lucide.dev/) names. Use camelCase or kebab-case; both `fileText` and `file-text` work.

## Link outside the docs

External and custom links can appear in the sidebar and command search:

```json
{
  "label": "GitHub",
  "url": "https://github.com/hunvreus/reallysimpledocs",
  "icon": "github"
}
```

## Reference

### Group

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `"group"` | Yes | Top-level section. |
| `label` | `string` | No | Sidebar section title. |
| `items` | `array` | Yes | Page items, links, or submenus. |

### Page item

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `slug` | `string` | Yes | Path under `docs/` without `.md` or `.mdx`. |
| `label` | `string` | No | Overrides the page title in navigation. |
| `icon` | `string` | No | Lucide icon name. |
| `badge` | `string` | No | Small badge shown next to the item. |
| `attrs` | `object` | No | Extra attributes passed to the link. |

You can also use `page` instead of `slug`.

### Link item

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `string` | Yes | Link text. |
| `url` | `string` | Yes | Internal or external URL. |
| `icon` | `string` | No | Lucide icon name. |
| `badge` | `string` | No | Small badge shown next to the item. |
| `attrs` | `object` | No | Extra attributes passed to the link. |

### Submenu

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `"submenu"` | Yes | Nested section. |
| `label` | `string` | Yes | Sidebar label. |
| `icon` | `string` | No | Lucide icon name. |
| `open` | `boolean` | No | Default open state. Current-page submenus open automatically. |
| `items` | `array` | Yes | Page items, links, or nested submenus. |

## Full example

```json
{
  "menu": [
    {
      "type": "group",
      "label": "Getting started",
      "items": [
        { "slug": "install", "label": "Quickstart", "icon": "download" },
        { "slug": "customization", "icon": "slidersVertical" },
        {
          "type": "submenu",
          "label": "Writing",
          "icon": "pencil",
          "open": true,
          "items": [
            "navigation",
            {
              "type": "submenu",
              "label": "Advanced",
              "icon": "settings",
              "items": ["pages"]
            }
          ]
        }
      ]
    }
  ]
}
```
