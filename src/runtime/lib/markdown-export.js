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

  for (const name of ["CodeGroup", "Tabs", "Tab", "CardGrid", "Preview", "Callout", "Steps", "Code"]) {
    out = replacePairedComponent(out, name, (attrs, children) => serializers[name](attrs, children, context));
  }

  out = out.replace(/<Code\b([^>]*)\/>/g, (_, attrs) => serializeCode(attrs, getCodeAttr(attrs, context), context));
  out = out.replace(/<Card\b([^>]*)\/>/g, (_, attrs) => serializeCard(attrs));

  return out;
}

function replacePairedComponent(content, name, serialize) {
  return content.replace(new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)<\\/${name}>`, "g"), (_, attrs, children) =>
    serialize(attrs, children),
  );
}

function serializeChildren(_attrs, children, context = new Map()) {
  return `\n\n${normalizeMdxComponents(children, context).trim()}\n\n`;
}

function serializePreview(attrs, children, context = new Map()) {
  const title = getStringAttr(attrs, "title");
  const code = getExpressionAttr(attrs, "code");
  const body = normalizeMdxComponents(code && context.has(code) ? context.get(code) : children, context).trim();
  return title ? `\n\n## ${title}\n\n${body}\n\n` : `\n\n${body}\n\n`;
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
  return `\n\n\`\`\`${lang}${label}\n${code}\n\`\`\`\n\n`;
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
