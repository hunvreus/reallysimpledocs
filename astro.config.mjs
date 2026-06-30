import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import reallySimpleDocs from "reallysimpledocs/astro";

const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open-icon lucide-book-open"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>`;

export default defineConfig({
  site: "https://reallysimpledocs.com",
  output: "static",
  trailingSlash: "ignore",
  integrations: [
    reallySimpleDocs({
      docsDir: "./docs",
      bodyAttrs: {
        "hx-boost": "true",
        "hx-target": "#content",
        "hx-select": "#content",
        "hx-swap": "outerHTML",
        "hx-push-url": "true",
      },
      components: {
        Head: "./site/Head.astro",
        ContentHeader: "./site/ContentHeader.astro",
      },
      site: {
        title: "ReallySimpleDocs",
        subtitle: "v1.0.12",
        description: "A really simple documentation system for Astro.",
        url: "https://reallysimpledocs.com",
        favicon: "favicon.svg",
        appleTouchIcon: "apple-touch-icon.png",
        socialImage: "social.png",
        logo: { svg: logo },
      },
      routeBase: "/",
    }),
    sitemap(),
  ],
});
