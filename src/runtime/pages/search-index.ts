import lunr from "lunr";
import config from "virtual:reallysimpledocs/config";
import { getSearchDocs } from "../lib/docs.js";

export function GET() {
  const documents = getSearchDocs(config);
  const index = lunr(function () {
    this.ref("slug");
    this.field("title", { boost: 10 });
    this.field("breadcrumb", { boost: 8 });
    this.field("body");
    this.field("code", { boost: 0.2 });
    this.metadataWhitelist = ["position"];

    documents.forEach((doc) => this.add(doc));
  });

  return new Response(
    JSON.stringify({
      index,
      documents: documents.map(({ slug, title, breadcrumb, path, body, code }) => ({
        slug,
        title,
        breadcrumb,
        path,
        body,
        code,
      })),
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}
