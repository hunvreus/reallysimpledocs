import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const read = (file) => {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Expected ${file} to exist.`);
  }
  return fs.readFileSync(filePath, "utf8");
};

const assertIncludes = (file, expected) => {
  const content = read(file);
  if (!content.includes(expected)) {
    throw new Error(`Expected ${file} to include: ${expected}`);
  }
};

assertIncludes(
  "dist/sitemap-index.xml",
  "https://reallysimpledocs.com/sitemap-0.xml",
);
assertIncludes("dist/sitemap-0.xml", "https://reallysimpledocs.com/quickstart/");
assertIncludes(
  "dist/robots.txt",
  "Sitemap: https://reallysimpledocs.com/sitemap-index.xml",
);

console.log("Site output assertions passed.");
