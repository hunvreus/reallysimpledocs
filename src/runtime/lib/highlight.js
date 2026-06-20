import { codeToHtml } from "shiki";

export async function highlightCode(code, lang = "text") {
  const value = String(code || "");
  const language = String(lang || "text").toLowerCase() === "mdx" ? "tsx" : String(lang || "text");
  return withScrollbar(await codeToHtml(value, {
    lang: language,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  }));
}

function withScrollbar(html) {
  return String(html || "").replace(/<pre class="/, '<pre class="scrollbar ');
}
