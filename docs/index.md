# Introduction

## Why ReallySimpleDocs?

There are plenty of existing solutions to create documentation websites: Mintlify, Fumadocs, Docusaurus, MkDocs... So why create another one?

I wanted something fast, modern, simple, and good-looking. I also wanted docs content to stay portable.

So I built ReallySimpleDocs as an [Astro](https://astro.build) integration with [Basecoat](https://basecoatui.com). You keep your content in `docs/`, define navigation in `docs/docs.json`, and let RSD render the docs section.

## Key features

- **Fast**: Astro builds static docs with minimal client JavaScript.
- **Standard and Reliable**: It's HTML, CSS, and a small amount of vanilla JavaScript.
- **Git-based with a user-friendly CMS**: All of your content lives in a GitHub repo. And if you need a user-friendly interface for your teammates to edit the content, just use [Pages CMS](https://pagescms.org).
- **Portable docs**: Keep Markdown pages and navigation in `docs/`, outside Astro's `src/content` conventions.
- **LLM-friendly**: Auto-generated `llms.txt`, `llms-full.txt`, and per-page `/*.md` exports for LLMs.
- **100% free and open source**: I have nothing to sell. No hosting plan, no advanced features. You can host it for free on Cloudflare Pages.

## How can I help?

ReallySimpleDocs is 100% open source and free.

- [Star it on GitHub](https://github.com/hunvreus/reallysimpledocs)
- [Report bugs or request features](https://github.com/hunvreus/reallysimpledocs/issues)
- [Submit a pull request](https://github.com/hunvreus/reallysimpledocs/pulls)
- [Sponsor the project](https://github.com/sponsors/hunvreus)
