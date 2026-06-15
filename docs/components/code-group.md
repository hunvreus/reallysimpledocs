# CodeGroup

Use `CodeGroup` for tabbed code examples, usually package-manager commands or platform-specific snippets. Use `Code` for a single snippet.

## Usage

Write a `code-group` block with one fenced code block per tab. The fence language controls syntax highlighting, and the text after the language becomes the tab label.

````md
:::code-group
```bash npm
npm install reallysimpledocs@beta
```

```bash pnpm
pnpm add reallysimpledocs@beta
```
:::
````

## Options

| Syntax | Notes |
| --- | --- |
| `:::code-group` | Starts a tabbed code block. |
| <code>```bash npm</code> | First word is the Shiki language. Remaining text is the tab label. |
| `:::` | Ends the tabbed code block. |

Use MDX and import `CodeGroup` directly only when you need component-level control.

## Examples

:::code-group
```bash pnpm
pnpm add reallysimpledocs@beta basecoat-css@beta tailwindcss
```

```bash npm
npm install reallysimpledocs@beta basecoat-css@beta tailwindcss
```

```bash yarn
yarn add reallysimpledocs@beta basecoat-css@beta tailwindcss
```

```bash bun
bun add reallysimpledocs@beta basecoat-css@beta tailwindcss
```
:::

:::code-group
```js Astro
import { defineConfig } from "astro/config";
import reallySimpleDocs from "reallysimpledocs";

export default defineConfig({
  integrations: [reallySimpleDocs()],
});
```

```md Markdown
# Introduction

Start writing docs in Markdown.
```
:::
