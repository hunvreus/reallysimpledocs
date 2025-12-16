---
title: Getting started
description: Create a docs site, customize it, and deploy it.
icon: rocket
---

## Create your docs

1. Create a new project with the [create-reallysimpledocs CLI](https://www.npmjs.com/package/create-reallysimpledocs):
    ```bash
    npx create-reallysimpledocs@latest my-docs
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

You can then [customize your site](/customization) and [manage content](/content).

## Deploy

Build the site with `npm run build` and upload `_site/` to a static host:

- [Cloudflare Pages](https://pages.cloudflare.com)
- [GitHub Pages](https://docs.github.com/en/pages)
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)