# ReallySimpleDocs

A simple documentation site template built with **Eleventy (11ty)**, **Basecoat**, and **Tailwind CSS**.

## Tech stack

- **Eleventy (11ty)** - Static site generator
- **Nunjucks** - Template engine
- **Tailwind CSS** - Styling
- **Basecoat** - UI components

## Development

```bash
npm install
npm run dev
```

## Scaffold (CLI)

Generate a new copy of the template with `create-reallysimpledocs`.

**Local dev (from this repo):**

```bash
npm run create my-docs
```

**Published CLI (from npm):**

```bash
npx create-reallysimpledocs@latest my-docs
```

If you omit `my-docs`, the CLI prompts for a directory name.

By default, the CLI downloads the template from `hunvreus/reallysimpledocs` (default branch). You can pin a ref:

```bash
npx create-reallysimpledocs@latest my-docs -- --ref <tag-or-commit>
```

## Build

```bash
npm run build
```

Output is written to `_site/`.

## Environment variables

- `SITE_URL` - Base URL for absolute links (default: `http://localhost:8080`)
  - Example: `SITE_URL=https://docs.example.com npm run build`

## Content

- Pages live in `docs/`.
- The sidebar and command menu are configured in `docs/docs.json`.
