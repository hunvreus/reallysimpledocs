---
title: LLMs
description: Understand the generated `llms.txt` files and per-page Markdown exports.
---

## Files

| Output | Source | Purpose |
|--------|--------|---------|
| `/_site/llms.txt` | `.eleventy.js` | Short index for LLM tools. |
| `/_site/llms-full.txt` | `.eleventy.js` | Expanded version (more content). |
| `/*.md` | `.eleventy.js` | Per-page Markdown export (used by **Copy page**). |

## How it’s used

The docs layout builds “Open in ChatGPT / Claude / Cursor” links from your page URL and your canonical URL (`site.url`, with optional `SITE_URL` override).
