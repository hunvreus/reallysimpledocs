import fs from "node:fs";

export const defaultSite = {
  title: "ReallySimpleDocs",
  description: "A really simple documentation site.",
  url: "",
};

export function getSite(config) {
  let fileSite = {};

  if (config.siteFile) {
    try {
      fileSite = JSON.parse(fs.readFileSync(config.siteFile, "utf8")) || {};
    } catch {
      fileSite = {};
    }
  }

  return {
    ...defaultSite,
    ...fileSite,
    ...(config.site || {}),
  };
}
