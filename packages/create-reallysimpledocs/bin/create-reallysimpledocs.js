#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";

const usage = () => {
  // Keep this terse. `npm create` tools usually print usage on invalid args only.
  console.log(
    [
      `Usage: create-reallysimpledocs <directory> [--force] [--repo <owner/name>] [--ref <ref>]`,
      ``,
      `Defaults:`,
      `  --repo hunvreus/reallysimpledocs`,
      `  --ref  HEAD`,
    ].join("\n"),
  );
};

const parseArgs = (argv) => {
  const result = {
    force: false,
    noLocal: false,
    repo: "hunvreus/reallysimpledocs",
    ref: "HEAD",
    target: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--force") {
      result.force = true;
      continue;
    }
    if (arg === "--no-local") {
      result.noLocal = true;
      continue;
    }
    if (arg === "--repo") {
      result.repo = argv[index + 1] || result.repo;
      index++;
      continue;
    }
    if (arg === "--ref") {
      result.ref = argv[index + 1] || result.ref;
      index++;
      continue;
    }
    if (arg.startsWith("-")) continue;

    if (!result.target) {
      result.target = arg;
    }
  }

  return result;
};

const promptForTarget = async () => {
  if (!process.stdin.isTTY) return null;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = (await rl.question("Project directory (my-docs): ")).trim();
    return answer || "my-docs";
  } catch (error) {
    if (error?.name === "AbortError" || error?.code === "ABORT_ERR") {
      process.stdout.write("\n");
      return null;
    }
    throw error;
  } finally {
    rl.close();
  }
};

const exists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

const isDirectory = async (p) => {
  try {
    return (await fs.stat(p)).isDirectory();
  } catch {
    return false;
  }
};

const isProbablyTemplateRoot = async (root) => {
  const required = [
    "docs/docs.json",
    "package.json",
    ".eleventy.js",
    "_includes",
    "_data",
    "src",
  ];
  try {
    for (const rel of required) {
      const p = path.join(root, rel);
      // eslint-disable-next-line no-await-in-loop
      await fs.access(p);
    }
    return true;
  } catch {
    return false;
  }
};

const resolveSourceRoot = async () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(here, "..");

  const packagedTemplate = path.join(packageRoot, "template");
  if (await isDirectory(packagedTemplate)) return packagedTemplate;

  // Monorepo fallback (local dev): packages/create-reallysimpledocs/bin -> repo root.
  const monorepoRoot = path.resolve(packageRoot, "../..");
  if (await isProbablyTemplateRoot(monorepoRoot)) return monorepoRoot;

  return null;
};

const IGNORE_ROOTS = new Set([
  ".git",
  "node_modules",
  "_site",
  "packages",
]);

const IGNORE_BASENAMES = new Set([
  ".DS_Store",
]);

const shouldIgnore = (relativePath, extraIgnoreRoots = new Set()) => {
  const parts = relativePath.split(path.sep).filter(Boolean);
  const root = parts[0];
  if (!root) return false;
  if (IGNORE_ROOTS.has(root) || extraIgnoreRoots.has(root)) return true;
  if (IGNORE_BASENAMES.has(path.basename(relativePath))) return true;
  return false;
};

const copyTree = async (srcRoot, dstRoot, relative = "", extraIgnoreRoots = new Set()) => {
  const srcPath = path.join(srcRoot, relative);
  const dstPath = path.join(dstRoot, relative);

  if (relative && shouldIgnore(relative, extraIgnoreRoots)) return;

  const stats = await fs.stat(srcPath);
  if (stats.isDirectory()) {
    await fs.mkdir(dstPath, { recursive: true });
    const entries = await fs.readdir(srcPath, { withFileTypes: true });
    for (const entry of entries) {
      const next = relative ? path.join(relative, entry.name) : entry.name;
      await copyTree(srcRoot, dstRoot, next, extraIgnoreRoots);
    }
    return;
  }

  if (stats.isFile()) {
    await fs.mkdir(path.dirname(dstPath), { recursive: true });
    await fs.copyFile(srcPath, dstPath);
    return;
  }
};

const run = async (command, args, options = {}) => {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
};

const downloadRepoToTemp = async ({ repo, ref }) => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "rsd-"));
  const target = path.join(tempRoot, "repo");

  const repoUrl = `https://github.com/${repo}.git`;
  if (!ref || ref === "HEAD") {
    await run("git", ["clone", "--depth", "1", repoUrl, target]);
  } else {
    try {
      await run("git", ["clone", "--depth", "1", "--branch", ref, repoUrl, target]);
    } catch (_) {
      await run("git", ["clone", "--depth", "1", repoUrl, target]);
      await run("git", ["-C", target, "checkout", ref]);
    }
  }

  // Remove git metadata; we don't want nested repos in the template output.
  await fs.rm(path.join(target, ".git"), { recursive: true, force: true });
  if (!(await isProbablyTemplateRoot(target))) {
    throw new Error(
      `Downloaded repo does not look like a ReallySimpleDocs template: ${repo}@${ref}`,
    );
  }
  return { tempRoot, repoRoot: target };
};

const stripTemplateOnlyBlocks = (source) => {
  return source.replace(
    /<!--\s*TEMPLATE_ONLY_START\s*-->[\s\S]*?<!--\s*TEMPLATE_ONLY_END\s*-->\s*/g,
    "",
  );
};

const postProcess = async (targetDir) => {
  const packageJsonPath = path.join(targetDir, "package.json");
  try {
    const raw = await fs.readFile(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed?.scripts?.create) {
      delete parsed.scripts.create;
    }
    await fs.writeFile(packageJsonPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  } catch (_) {}

  const templateOnlyFiles = [
    path.join(targetDir, "docs", "getting-started.md"),
  ];
  for (const filePath of templateOnlyFiles) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const next = stripTemplateOnlyBlocks(raw);
      if (next !== raw) await fs.writeFile(filePath, next, "utf8");
    } catch (_) {}
  }
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    usage();
    process.exit(0);
  }

  const targetArg = args.target || (await promptForTarget());
  if (!targetArg) {
    usage();
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), targetArg);
  const localSourceRoot = args.noLocal ? null : await resolveSourceRoot();

  if (await exists(targetDir)) {
    const entries = await fs.readdir(targetDir).catch(() => []);
    if (entries.length > 0 && !args.force) {
      console.error(`Target directory is not empty: ${targetDir}`);
      console.error(`Re-run with --force to copy anyway.`);
      process.exit(1);
    }
  }

  await fs.mkdir(targetDir, { recursive: true });

  let tempRoot = null;
  try {
    if (localSourceRoot) {
      const extraIgnoreRoots = new Set();
      const relativeTarget = path.relative(localSourceRoot, targetDir);
      if (relativeTarget && !relativeTarget.startsWith("..") && !path.isAbsolute(relativeTarget)) {
        // Prevent recursive copying when the output directory is inside the source repo.
        // Example: running the CLI from the template repo and scaffolding into `./tmp-docs`.
        extraIgnoreRoots.add(relativeTarget.split(path.sep)[0]);
      }

      await copyTree(localSourceRoot, targetDir, "", extraIgnoreRoots);
    } else {
      console.log(`Downloading template from ${args.repo}@${args.ref}...`);
      const downloaded = await downloadRepoToTemp({ repo: args.repo, ref: args.ref });
      tempRoot = downloaded.tempRoot;
      await copyTree(downloaded.repoRoot, targetDir);
    }

    await postProcess(targetDir);
  } finally {
    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true }).catch(() => {});
    }
  }

  console.log("");
  console.log(`\x1b[32m✓ Created ReallySimpleDocs project in: ${targetDir}\x1b[0m`);
  console.log("");
  console.log("Next steps:");
  console.log(`1. cd ${path.relative(process.cwd(), targetDir) || "."} && npm install`);
  console.log("2. npm run dev");
};

main().catch((error) => {
  if (error?.name === "AbortError" || error?.code === "ABORT_ERR") {
    process.exit(0);
  }

  console.error(error);
  process.exit(1);
});
