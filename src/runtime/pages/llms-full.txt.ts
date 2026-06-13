import config from "virtual:reallysimpledocs/config";
import { getLlmDocs } from "../lib/docs.js";
import { getSite } from "../lib/site.js";

export function GET({ site }) {
  const siteData = getSite(config);
  const siteUrl = site?.toString().replace(/\/$/, "") || siteData.url || "";
  const lines = [];

  getLlmDocs(config).forEach((doc) => {
    lines.push(`# ${doc.title}`, `Source: ${siteUrl}${doc.path}`, "");
    lines.push(doc.content, "", "---", "");
  });

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
