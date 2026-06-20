import { codeToHtml } from "shiki";

export async function highlightCode(code, lang = "text") {
  const value = String(code || "");
  const language = String(lang || "text").toLowerCase() === "mdx" ? "tsx" : String(lang || "text");
  return codeToHtml(value, {
    lang: language,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  });
}
