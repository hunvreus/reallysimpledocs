# Changelog

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
