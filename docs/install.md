---
title: Install
description: Create a new docs site and deploy it.
icon: package
---

## Create your docs

1. Create a new project using [the GitHub template](https://github.com/hunvreus/reallysimpledocs/generate) or the CLI:
    ```bash
    npm create reallysimpledocs@latest my-docs
    # or: npx create-reallysimpledocs@latest my-docs
    ```
2. Install dependencies:
    ```bash
    cd my-docs && npm install
    ```
3. Start the dev server:
    ```bash
    npm run dev
    ```
4. Open up the site at `http://localhost:8080`

You can then [customize your site](/customize/) and [write docs](/content/).

## Deploy

Build the site with `npm run build` and upload `_site/` to a static host:

- [Cloudflare Pages](https://pages.cloudflare.com)
- [GitHub Pages](https://docs.github.com/en/pages)
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)

## Upgrade

This template is intentionally simple: the easiest “upgrade” flow is to scaffold a fresh copy and move your content back in.

1. Scaffold a new copy (next version).
2. Copy your content and config:
   - `docs/`
   - `docs/docs.json`
   - `_data/site.json`
   - `media/` (if you use it)
3. Re-apply any local customizations you made in:
   - `_includes/`
   - `src/css/overrides.css`
