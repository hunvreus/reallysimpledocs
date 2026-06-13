import config from "virtual:reallysimpledocs/config";
import { getMarkdownExport, getPages } from "../lib/docs.js";

export function getStaticPaths() {
  return getPages(config).map((page) => ({
    params: { slug: page.slug },
    props: { page },
  }));
}

export function GET({ props }) {
  return new Response(getMarkdownExport(config, props.page), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}
