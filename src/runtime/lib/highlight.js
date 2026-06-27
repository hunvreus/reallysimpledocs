import { codeToHtml } from "shiki";

export async function highlightCode(code, lang = "text") {
  const value = String(code || "");
  const language = String(lang || "text").toLowerCase() === "mdx" ? "tsx" : String(lang || "text");
  const html = await codeToHtml(value, {
    lang: language,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  });
  return addPreClass(html, "scrollbar");
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
