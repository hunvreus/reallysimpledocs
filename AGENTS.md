# AI Agent Guidelines for /dev/push Documentation

Guidelines for AI agents working on the documentation website.

## Writing Style

- **Concise**: Keep sentences short. Remove filler words.
- **Direct**: Lead with the action or key information.
- **Technical**: Assume readers are developers. Don't over-explain basics.

## Structure

### Alert Blocks

Use alert blocks for important contextual information:

```njk
<div class="alert">
  {% lucide "triangle-alert" %}
  <h3>Alert title</h3>
  <section>
    <p>Alert content here.</p>
  </section>
</div>
```

### Contextual Links

Add related documentation links at the end of sections:

```njk
<div class="flex flex-wrap gap-2 my-6">
  <a href="/docs/configuration#ssl-providers" class="badge-outline">
    SSL Providers
    {% lucide "arrow-right" %}
  </a>
</div>
```

### Tables

Prefer tables over long lists when showing structured data (paths, permissions, options).

### Code Blocks

- Use `bash` for shell commands
- Keep examples minimal—show only what's necessary
- Add comments sparingly, only when the command isn't self-explanatory

## Menu

Update `docs/docs.json` when adding or reorganizing pages:

```json
{
  "menu": [
    {
      "type": "group",
      "label": "Getting started",
      "items": ["index", "installation", "configuration"]
    }
  ]
}
```

## File Organization

- Main docs: `docs/`
- Nested topics: `docs/<topic>/` (e.g., `docs/basics/`)
- Each page needs frontmatter with `title` and `description`

## Formatting

- Use backticks for: file paths, commands, environment variables, code references
- Use bold for: UI elements, key terms on first use
- Use tables for: structured data, comparisons, reference lists
- Avoid: excessive headings, redundant explanations, long paragraphs
