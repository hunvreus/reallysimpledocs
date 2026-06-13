import config from "virtual:reallysimpledocs/config";
import { flattenMenuSlugs, getLlmDocs, getManifest } from "../lib/docs.js";
import { getSite } from "../lib/site.js";

export function GET({ site }) {
  const manifest = getManifest(config);
  const docs = getLlmDocs(config);
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));
  const siteData = getSite(config);
  const siteUrl = site?.toString().replace(/\/$/, "") || siteData.url || "";
  const lines = [`# ${siteData.title}`, "", "## Docs", ""];

  (manifest.menu || []).forEach((group) => {
    if (group?.type !== "group") return;
    lines.push(`### ${group.label || "Docs"}`, "");

    const addSlug = (slug) => {
      const doc = bySlug.get(slug);
      if (!doc) return;
      const url = `${siteUrl}${doc.path}`;
      lines.push(`- [${doc.title}](${url})`);
    };

    flattenMenuSlugs([group]).forEach(addSlug);

    lines.push("");
  });

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
