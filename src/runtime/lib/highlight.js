import { codeToHtml } from "shiki";

const defaultShikiConfig = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
};

export async function highlightCode(code, lang = "text", shiki = defaultShikiConfig) {
  const value = String(code || "");
  const language = String(lang || "text").toLowerCase() === "mdx" ? "tsx" : String(lang || "text");
  const html = await codeToHtml(value, {
    lang: language,
    ...normalizeShikiConfig(shiki),
  });
  return addPreClass(html, "scrollbar");
}

function normalizeShikiConfig(value = {}) {
  return {
    themes: {
      ...defaultShikiConfig.themes,
      ...(value.themes || {}),
    },
    defaultColor: value.defaultColor ?? defaultShikiConfig.defaultColor,
  };
}

function addPreClass(html, className) {
  return String(html).replace(/<pre(\s[^>]*)?>/, (match, attrs = "") => {
    const classMatch = attrs.match(/\sclass=(["'])(.*?)\1/s);
    if (!classMatch) return `<pre class="${className}"${attrs}>`;
    const classes = new Set(classMatch[2].split(/\s+/).filter(Boolean));
    classes.add(className);
    return match.replace(classMatch[0], ` class=${classMatch[1]}${[...classes].join(" ")}${classMatch[1]}`);
  });
}
