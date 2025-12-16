---
title: Navigation
description: Define the sidebar and command menu structure in `docs/docs.json`.
---

## Where navigation lives

The docs navigation menu is configured in `docs/docs.json` under the `menu` key.

## Menu schema

`menu` is an array of **groups**. Each group has an `items` array.

| Key | Type | Required | Notes |
|-----|------|----------|------|
| `menu` | `array` | Yes | Top-level list of groups. |
| `menu[].type` | `"group"` | Yes | Group container. |
| `menu[].label` | `string` | No | Section title in the sidebar. |
| `menu[].items` | `array` | Yes | Page slugs and submenus. |

`items` supports:

| Item | Type | Notes |
|------|------|------|
| Page slug | `string` | Example: `"getting-started"`, `"content/markdown"`. |
| Submenu | `object` | `{ type: "submenu", label, open?, items: [slug...] }` |

<div class="alert">
  {% lucide "triangle-alert" %}
  <h3>Use slugs, not file names</h3>
  <section>
    <p>Use the path without <code>.md</code>. Example: <code>docs/content/markdown.md</code> becomes <code>"content/markdown"</code>.</p>
  </section>
</div>

## Example

```json
{
  "menu": [
    {
      "type": "group",
      "items": ["index", "getting-started", "architecture"]
    },
    {
      "type": "group",
      "label": "Content",
      "items": [
        "content/index",
        {
          "type": "submenu",
          "label": "Writing",
          "open": true,
          "items": ["content/markdown", "content/code"]
        }
      ]
    }
  ]
}
```

## Sidebar vs search vs prev/next

This single `menu` drives:

- Sidebar structure (`menu | sidebarMenu(collections)`).
- Command menu items + keywords (`menu | commandMenu(collections)`).
- Prev/next navigation (`menu | getNavigation`).

Pages not listed in `menu` still build, but they won’t appear in the sidebar, command menu, or prev/next flow.

<div class="flex flex-wrap gap-2 my-6">
  <a href="/customization/search/" class="badge-outline">
    Search
    {% lucide "arrow-right" %}
  </a>
  <a href="/customization/layout/" class="badge-outline">
    Layout
    {% lucide "arrow-right" %}
  </a>
</div>
