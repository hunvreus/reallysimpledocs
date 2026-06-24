export function normalizeDocMarkdown(markdown, context = new Map()) {
  return transformMarkdownTextSegments(markdown, (content) => {
    return normalizeMdxComponents(stripMdxModuleSyntax(content), context);
  })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripMdxModuleSyntax(content) {
  return String(content || "")
    .replace(/^\s*import\s+[^;\n]+;?\s*$/gm, "")
    .replace(/^\s*export\s+(?:const|let|var|function)\s+[\s\S]*?(?=\n(?:#|[A-Z][A-Za-z]*\(|<[A-Z]|\w|\s*$))/gm, "");
}

function transformMarkdownTextSegments(markdown, transform) {
  return String(markdown || "")
    .split(/(```[\s\S]*?```)/g)
    .map((part) => (part.startsWith("```") ? part : transform(part)))
    .join("");
}

const serializers = {
  Code: serializeCode,
  CodeGroup: serializeChildren,
  Tabs: serializeChildren,
  Tab: serializeChildren,
  CardGrid: serializeChildren,
  Preview: serializePreview,
  Callout: serializeCallout,
  Steps: serializeSteps,
  Card: serializeCard,
};

export function normalizeMdxComponents(content, context = new Map()) {
  let out = String(content || "");
  const previewBlocks = [];

  out = replacePairedComponent(out, "Preview", (attrs, children) => {
    const token = `\u0000RSD_PREVIEW_${previewBlocks.length}\u0000`;
    previewBlocks.push(serializers.Preview(attrs, children, context));
    return token;
  });

  for (const name of ["CodeGroup", "Tabs", "Tab", "CardGrid", "Callout", "Steps", "Code"]) {
    out = replacePairedComponent(out, name, (attrs, children) => serializers[name](attrs, children, context));
  }

  out = out.replace(/<Code\b([^>]*)\/>/g, (_, attrs) => serializeCode(attrs, getCodeAttr(attrs, context), context));
  out = out.replace(/<Card\b([^>]*)\/>/g, (_, attrs) => serializeCard(attrs));
  previewBlocks.forEach((block, index) => {
    out = out.replaceAll(`\u0000RSD_PREVIEW_${index}\u0000`, block);
  });

  return out;
}

function replacePairedComponent(content, name, serialize) {
  let output = "";
  let cursor = 0;
  const source = String(content || "");

  while (cursor < source.length) {
    const open = findNextTag(source, name, cursor);
    if (!open) {
      output += source.slice(cursor);
      break;
    }

    const close = findMatchingCloseTag(source, open);
    if (!close) {
      output += source.slice(cursor);
      break;
    }

    output += source.slice(cursor, open.start);
    output += serialize(open.attrs, source.slice(open.end, close.start));
    cursor = close.end;
  }

  return output;
}

function serializeChildren(_attrs, children, context = new Map()) {
  return `\n\n${normalizeMdxComponents(children, context).trim()}\n\n`;
}

function serializePreview(attrs, children, context = new Map()) {
  const lang = getStringAttr(attrs, "lang") || "mdx";
  const code = getExpressionAttr(attrs, "code");
  const source = stripCommonIndent(code && context.has(code) ? context.get(code) : children).trim();
  return `\n\n${fencedCode(lang, source)}\n\n`;
}

function serializeCallout(attrs, children, context = new Map()) {
  const title = getStringAttr(attrs, "title") || calloutTitle(getStringAttr(attrs, "type"));
  const body = normalizeMdxComponents(children, context)
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `\n\n> **${title}**\n${body ? `${body}\n` : ""}\n`;
}

function serializeSteps(_attrs, children, context = new Map()) {
  let index = 0;
  const steps = children.replace(/<Step\b([^>]*)>([\s\S]*?)<\/Step>/g, (_step, attrs, body) => {
    index += 1;
    const title = getStringAttr(attrs, "title");
    const text = normalizeMdxComponents(body, context).trim();
    return `${index}. ${title ? `**${title}**` : ""}${text ? `\n\n${indentMarkdown(text, "   ")}` : ""}`;
  });
  return `\n\n${steps}\n\n`;
}

function serializeCode(attrs, children, context = new Map()) {
  const lang = getStringAttr(attrs, "lang") || "text";
  const title = getStringAttr(attrs, "title");
  const label = title ? ` ${title}` : "";
  const code = unwrapMdxString(children, context).trim();
  return `\n\n${fencedCode(`${lang}${label}`, code)}\n\n`;
}

function serializeCard(attrs) {
  const title = getStringAttr(attrs, "title") || "Card";
  const description = getStringAttr(attrs, "description");
  const href = getStringAttr(attrs, "href");
  const label = description ? `**${title}**: ${description}` : `**${title}**`;
  return href ? `\n\n- [${label}](${href})\n` : `\n\n- ${label}\n`;
}

function getStringAttr(attrs, name) {
  return String(attrs || "").match(new RegExp(`${name}=["']([^"']*)["']`))?.[1] || "";
}

function getExpressionAttr(attrs, name) {
  return String(attrs || "").match(new RegExp(`${name}=\\{([A-Za-z_$][\\w$]*)\\}`))?.[1] || "";
}

function getCodeAttr(attrs, context = new Map()) {
  const direct = String(attrs || "").match(/\bcode=\{`([\s\S]*?)`\}/)?.[1] || "";
  if (direct) return direct.replace(/\\n/g, "\n").replace(/\\`/g, "`");
  const ref = getExpressionAttr(attrs, "code");
  return ref && context.has(ref) ? context.get(ref) : "";
}

function unwrapMdxString(value, context = new Map()) {
  const text = String(value || "").trim();
  const ref = text.match(/^\{([A-Za-z_$][\w$]*)\}$/)?.[1];
  if (ref && context.has(ref)) return context.get(ref);
  const template = text.match(/^\{`([\s\S]*)`\}$/);
  if (template) return template[1].replace(/\\n/g, "\n").replace(/\\`/g, "`");
  return text.replace(/^\{["']([\s\S]*)["']\}$/, "$1");
}

function calloutTitle(type) {
  if (type === "warning") return "Warning";
  if (type === "destructive") return "Danger";
  return "Note";
}

function indentMarkdown(markdown, prefix) {
  return String(markdown || "")
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

function fencedCode(info, code) {
  const fence = longestBacktickRun(code) >= 3 ? "`".repeat(longestBacktickRun(code) + 1) : "```";
  return `${fence}${info}\n${code}\n${fence}`;
}

function longestBacktickRun(value) {
  return Math.max(0, ...String(value || "").matchAll(/`+/g).map((match) => match[0].length));
}

function findMatchingCloseTag(source, open) {
  let depth = 1;
  let cursor = open.end;

  while (cursor < source.length) {
    const tag = findNextTag(source, open.name, cursor);
    if (!tag) return null;
    if (tag.closing) depth -= 1;
    else if (!tag.selfClosing) depth += 1;
    if (depth === 0) return tag;
    cursor = tag.end;
  }

  return null;
}

function findNextTag(source, name, fromIndex) {
  let cursor = fromIndex;

  while (cursor < source.length) {
    const start = source.indexOf("<", cursor);
    if (start === -1) return null;
    const tag = readTag(source, start);
    if (!tag) {
      cursor = start + 1;
      continue;
    }
    if (tag.name === name) return tag;
    if (!tag.closing && !tag.selfClosing && tag.name.toLowerCase() === "script") {
      const scriptEnd = source.toLowerCase().indexOf("</script>", tag.end);
      cursor = scriptEnd === -1 ? source.length : scriptEnd + "</script>".length;
      continue;
    }
    cursor = tag.end;
  }

  return null;
}

function readTag(source, start) {
  let cursor = start + 1;
  let closing = false;

  if (source[cursor] === "/") {
    closing = true;
    cursor += 1;
  }

  const nameStart = cursor;
  while (/[$A-Z_a-z0-9-]/.test(source[cursor] || "")) cursor += 1;
  const name = source.slice(nameStart, cursor);
  if (!name) return null;

  let quote = "";
  while (cursor < source.length) {
    const char = source[cursor];
    if (quote) {
      if (char === "\\" && source[cursor + 1]) {
        cursor += 2;
        continue;
      }
      if (char === quote) quote = "";
      cursor += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      cursor += 1;
      continue;
    }
    if (char === ">") {
      const sourceTag = source.slice(start, cursor + 1);
      const beforeEnd = sourceTag.trimEnd();
      return {
        start,
        end: cursor + 1,
        name,
        closing,
        selfClosing: beforeEnd.endsWith("/>"),
        attrs: closing ? "" : sourceTag.slice(name.length + 1, -1).replace(/\/$/, ""),
      };
    }
    cursor += 1;
  }

  return null;
}

function stripCommonIndent(value) {
  const lines = String(value || "").replace(/^\n+|\n+$/g, "").split("\n");
  const indents = lines.filter((line) => line.trim()).map((line) => line.match(/^[ \t]*/)[0].length);
  const indent = indents.length ? Math.min(...indents) : 0;
  return indent ? lines.map((line) => line.slice(Math.min(indent, line.match(/^[ \t]*/)[0].length))).join("\n") : lines.join("\n");
}
