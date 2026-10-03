import { spawnSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roots = [join(root, "public"), join(root, "scripts")];
const ignoredDirectories = new Set([
  ".agent-runs",
  ".git",
  "cosmetichot",
  "dist",
  "docs",
  "env",
  "node_modules",
  "screenshots",
]);
const sourceExtensions = new Set([".css", ".html", ".js", ".mjs"]);

const diagnostics = [];
const counts = {
  css: 0,
  html: 0,
  js: 0,
};

function displayPath(file) {
  return relative(root, file).replaceAll("\\", "/");
}

function addDiagnostic(file, message) {
  diagnostics.push(`${displayPath(file)}: ${message}`);
}

async function* sourceFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    addDiagnostic(directory, `unable to read directory: ${error.message}`);
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        yield* sourceFiles(join(directory, entry.name));
      }
      continue;
    }

    if (entry.isFile() && sourceExtensions.has(extname(entry.name))) {
      yield join(directory, entry.name);
    }
  }
}

async function readSource(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    addDiagnostic(file, `unable to read file: ${error.message}`);
    return "";
  }
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function checkCss(file, css) {
  counts.css += 1;
  const source = stripCssComments(css);

  if (/\btransition\s*:\s*all\b/i.test(source)) {
    addDiagnostic(file, "avoid transition: all; list animated properties explicitly");
  }

  if (/\bwill-change\s*:\s*all\b/i.test(source)) {
    addDiagnostic(file, "avoid will-change: all; list optimized properties explicitly");
  }
}

function checkHtml(file, html) {
  counts.html += 1;
  const source = stripHtmlComments(html);
  const seenIds = new Set();
  const reportedIds = new Set();

  for (const match of source.matchAll(/\bid\s*=\s*(["'])(.*?)\1/gi)) {
    const id = match[2].trim();
    if (!id) continue;
    if (seenIds.has(id) && !reportedIds.has(id)) {
      addDiagnostic(file, `duplicate id "${id}"`);
      reportedIds.add(id);
    }
    seenIds.add(id);
  }

  for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\balt\s*=/i.test(tag)) {
      addDiagnostic(file, "img missing alt attribute");
    }
  }
  for (const match of source.matchAll(/\baria-label\s*=\s*(["'])(.*?)\1/gi)) {
    if (!match[2].trim() || /^\?+$/.test(match[2])) {
      addDiagnostic(file, "aria-label must contain meaningful text");
    }
  }
}

function checkJavaScript(file) {
  counts.js += 1;
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0) {
    const details = `${result.stderr}${result.stdout}`.trim().split(/\r?\n/).slice(-4).join(" ");
    addDiagnostic(file, `JavaScript syntax check failed${details ? `: ${details}` : ""}`);
  }
}

for (const sourceRoot of roots) {
  for await (const file of sourceFiles(sourceRoot)) {
    const extension = extname(file);

    if (extension === ".js" || extension === ".mjs") {
      checkJavaScript(file);
      continue;
    }

    const source = await readSource(file);
    if (extension === ".html") checkHtml(file, source);
    if (extension === ".css") checkCss(file, source);
  }
}

if (diagnostics.length > 0) {
  for (const diagnostic of diagnostics) console.error(diagnostic);
  process.exitCode = 1;
} else {
  console.log(`Linted ${counts.html} HTML, ${counts.css} CSS, and ${counts.js} JS files.`);
}
