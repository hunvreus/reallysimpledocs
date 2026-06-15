# Callout

Use callouts for notes, tips, warnings, and destructive or irreversible actions. Normal note, info, and tip callouts use the regular Basecoat alert color. Warning and danger callouts use variant colors.

## Usage

Use a callout directive in regular Markdown:

````md
:::warning Good to know
Keep normal docs pages as Markdown.
:::
````

Set a custom Lucide icon with an attribute:

````md
:::note Custom icon {icon="sparkles"}
Use any Lucide icon name in camelCase or kebab-case.
:::
````

Hide the icon with `icon="false"`:

````md
:::note No icon {icon="false"}
This reads more like regular copy.
:::
````

## Options

| Syntax | Notes |
| --- | --- |
| `:::note` | Regular alert styling. |
| `:::info` | Regular alert styling. |
| `:::tip` | Regular alert styling. |
| `:::warning` | Amber variant styling. |
| `:::danger` | Destructive variant styling. |
| `:::warning Custom title` | Text after the directive name is used as the title. |
| `{icon="sparkles"}` | Uses a Lucide icon name. Supports camelCase or kebab-case. |
| `{icon="false"}` | Hides the icon. |

Use MDX and import `Callout` directly only when you need component-level control.

## Examples

:::note Note
Use a callout when the surrounding paragraph is not enough.
:::

:::tip Tip
Use MDX only for pages that need components or custom layout.
:::

:::warning Warning
Avoid putting app-only imports in reusable documentation examples.
:::

:::danger Destructive
This variant is for irreversible actions, security risks, or migration warnings.
:::

:::note No icon {icon="false"}
Set `icon="false"` when the message should read like normal copy.
:::

:::note Custom icon {icon="sparkles"}
Use any Lucide icon name in camelCase or kebab-case.
:::
