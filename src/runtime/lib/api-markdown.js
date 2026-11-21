import { Marked } from "marked";
import GithubSlugger from "github-slugger";

export function renderApiMarkdown(text, prefix) {
const slugger = new GithubSlugger();
const headings = [];
const markdown = new Marked({
  renderer: {
    heading(token) {
      const depth = Math.max(2, token.depth);
      const label = this.parser.parseInline(token.tokens);
      if (!prefix) return `<h${depth}>${label}</h${depth}>`;
      const id = `${prefix}-${slugger.slug(this.parser.parseInline(token.tokens, this.parser.textRenderer))}`;
      if (depth <= 3) headings.push({ depth, id, text: this.parser.parseInline(token.tokens, this.parser.textRenderer) });
      return `<h${depth} id="${id}">${label}</h${depth}>`;
    },
    html: () => "",
    image: ({ text }) => text.replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]),
    link(token) {
      const label = this.parser.parseInline(token.tokens);
      const href = token.href;
      if (!/^(?:https?:\/\/|mailto:|#|\/(?!\/)|\.\.?\/)/i.test(href) || /[\s\\]/.test(href)) return label;
      return `<a href="${href.replace(/[&"<>]/g, char => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[char])}">${label}</a>`;
    },
  },
});
return { html: markdown.parse(String(text || "")), headings };
}
