# Agent rules

## Communication
- Keep answers concise, technical, and direct.
- If scope is partial, state exactly what is not included.

## Architecture
- Keep the Astro integration entry in `src/astro`.
- Keep runtime UI in `src/runtime/components`, runtime helpers in `src/runtime/lib`, runtime routes in `src/runtime/pages`, and public package exports in `src/components`.
- Keep docs content in `docs/` and navigation in `docs/docs.json`.
- Prefer small, function-first modules with explicit boundary contracts: typed inputs/outputs, side effects, error shape, and failure behavior.

## UI
- Use Basecoat markup and classes as documented; do not recreate Basecoat component styling with custom CSS.
- Prefer standard Basecoat composition patterns for sidebar, command, dropdown, buttons, dialogs, and navigation.
- Keep runtime UI in `src/runtime/components`; promote public override components through `src/components` only when they are part of the package API.
- Use Lucide icons through the existing icon pipeline. Sidebar icons come from `docs/docs.json`.

## Code style
- Prefer short names when clear.
- Keep control flow explicit; use simple deterministic structures like `Map`, arrays, and plain objects.
- Normalize loose inputs at module edges and keep error paths explicit.

## TypeScript
- Use strict boundary types, typed imports, and narrow interfaces where TypeScript is used.
- Avoid `any`; if unavoidable, keep scope narrow and document why.
- Verify dependency typings before guessing external API shapes.
- Use top-level type imports; do not change behavior just to silence dependency type errors.

## Change management
- Ask before removing behavior that appears intentional.
- Do not preserve backward compatibility unless explicitly requested.
- Keep user-facing bindings/config controls data-driven, not hardcoded.
- After large changes/removals, prune dead code and simplify touched dependencies.
- Check `npm pack --dry-run` before treating package changes as done.

## Testing
- Add or update focused tests when changing behavior, parsing, routing, navigation, search, exports, package API, or public integration contracts.
- Run the narrowest useful verification first, then broader checks when the change touches shared behavior.
- For broad or cross-cutting changes, run `npm run build`, `npm pack --dry-run`, and a clean consumer-app smoke test.
- For UI changes, verify in a browser at desktop and mobile widths.
- Do not remove tests just to make a suite pass; fix behavior or update stale expectations deliberately.

## Documentation
- Use sentence-case Markdown headings.
- Comment only non-obvious intent, invariants, edge cases, and tradeoffs.
- Update docs, examples, `CHANGELOG.md`, and `TODO.md` with behavior/config/workflow/API/architecture changes.
- Prefer editing existing docs; do not add empty categories, placeholder docs, private route catalogs, or unvalidated specs.
- Keep transient notes, audits, feedback rounds, and baselines in `.tmp/`, issues, or temporary branches.
- Structure:
  - `README.md`: product overview, setup, common commands, and links.
  - `ARCHITECTURE.md`: integration mechanics, runtime shape, data flow, invariants, and non-obvious decisions.
  - `TODO.md`: the single unresolved-work list; no TODO/backlog files under `docs/`.
  - `CHANGELOG.md`: implemented visible changes using Keep a Changelog.
  - `docs/index.md`: docs entrypoint; no `README.md` under `docs/`.
  - `docs/*.md` and `docs/**/*.md`: user-facing documentation pages with an `h1` title.
  - `docs/docs.json`: sidebar and navigation tree.
  - `docs/development/*.md`: local setup, testing, packaging, and safe change workflows.
  - OpenAPI: only for stable external contracts when validation/generation keeps it correct.
