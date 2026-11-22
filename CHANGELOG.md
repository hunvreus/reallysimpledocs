# Changelog

## Unreleased

### Added

- GitHub-style Note, Tip, Important, Warning, and Caution alerts in Markdown and MDX, using Callout styling.

## 1.2.0 — 2026-11-22

### Upgrading

- Replace `CodeGroup` with `Tabs` and `Tab` containing ordinary fenced code or `Code` components.
- Pass an explicit `code` string to `Preview`. Preview scripts now follow normal MDX and imported-component behavior.
- Remove imports of `reallysimpledocs/css/styles/*`; Basecoat supplies component styles directly.
- Nova is now the default style. Set `style: "vega"` explicitly to keep Vega.

### Changed

- Default to Basecoat Nova and use Basecoat Typeset for document typography. Cards and callouts use native component styling; warnings use the neutral alert style.
- Code blocks and tabs use standard Basecoat styling and behavior. Fenced examples use the same code blocks as `Code`, with optional titles and an actions slot.
- Linked cards use a muted hover background and keyboard focus ring. Code component examples now include Preview blocks.
- Preview composes Tabs and Code and requires an explicit `code` string. Example scripts use normal MDX or imported components.
- Replaced CodeGroup with Tabs containing Code or fenced examples. Removed the custom code and preview frame styles and their `css/styles/*` exports.

## 1.1.1 — 2026-11-21

### Changed

- Updated Basecoat to 1.2.1 and raised its minimum supported version accordingly.
- Requires Tailwind CSS 4.3 or newer within version 4 to compile Basecoat’s source stylesheets.

## 1.1.0 — 2026-11-21

### Upgrading

- Requires Astro 7.4.13 or newer within version 7 and Node.js 22.23.4 or newer. Astro 6 is no longer supported.
- Update your application's Astro dependency before installing this release.
- The release is tested with Basecoat 1.1.0.

### Added

- Canonical URLs and structured article and breadcrumb metadata on documentation pages.
- Per-page social images through the `site.pageSocialImage` setting, using `{slug}` in the image path.
- Social image alternative text based on the page title.

### Changed

- Updated Astro, MDX, Markdown, and Tailwind build dependencies for Astro 7.

### Fixed

- Preserved Basecoat and search browser scripts in Astro 7 builds.
- Kept long sidebar labels within their rows without shrinking badges or external-link icons.
