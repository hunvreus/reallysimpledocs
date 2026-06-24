# Introduction

## Why ReallySimpleDocs?

There are plenty of existing solutions for creating documentation websites: Mintlify, Fumadocs, Docusaurus, MkDocs... So why create another one?

I wanted something that wasn't bloated. That meant no React. I also wanted it to use the [shadcn/ui design system](https://ui.shadcn.com/) since that's what I use for most of my apps. Finally, I wanted it to be dead simple to use.

So I built ReallySimpleDocs as an [Astro](https://astro.build) integration with [Basecoat](https://basecoatui.com) for the design. You keep your content in `docs/`, define navigation in `docs/docs.json`, and let ReallySimpleDocs do the rest.

## Key features

- **Fast**: Astro builds static docs with minimal client JavaScript.
- **Simple**: It's HTML, CSS, and a small amount of vanilla JavaScript.
- **shadcn/ui-compatible**: It uses [Basecoat](https://basecoatui.com), so the docs UI follows shadcn/ui-style markup without requiring React.
- **Portable docs**: Keep Markdown pages and navigation in `docs/`, outside Astro's `src/content` conventions.
- **AI-friendly**: Auto-generated `llms.txt`, `llms-full.txt`, and per-page `/*.md` exports for LLMs.
- **100% free and open source**: I have nothing to sell. No hosting plan, no advanced features. You can host it for free on Cloudflare Pages.

## How can I help?

ReallySimpleDocs is 100% open source and free.

- [Star it on GitHub](https://github.com/hunvreus/reallysimpledocs)
- [Report bugs or request features](https://github.com/hunvreus/reallysimpledocs/issues)
- [Submit a pull request](https://github.com/hunvreus/reallysimpledocs/pulls)
- [Sponsor the project](https://github.com/sponsors/hunvreus)
