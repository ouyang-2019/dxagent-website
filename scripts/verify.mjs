import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
const sites = ["home", "blog", "apps", "projects"];
const errors = [];
let pageCount = 0;

async function exists(path) {
  return Boolean(await stat(path).catch(() => null));
}

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (entry.isFile()) yield path;
  }
}

for (const site of sites) {
  const siteRoot = join(output, site);
  if (!(await exists(join(siteRoot, "index.html")))) {
    errors.push(`${site}: missing index.html`);
    continue;
  }

  for await (const file of files(siteRoot)) {
    if (extname(file) !== ".html") continue;
    pageCount += 1;
    const html = await readFile(file, "utf8");
    if (!/<html\b[^>]*\blang=/i.test(html)) errors.push(`${file}: missing html lang`);
    if (!/<main\b/i.test(html)) errors.push(`${file}: missing main landmark`);
    if ((html.match(/<h1\b/gi) ?? []).length !== 1) {
      errors.push(`${file}: expected one h1`);
    }

    const links = html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi);
    for (const [, , value] of links) {
      if (value === "#") {
        errors.push(`${file}: placeholder link`);
        continue;
      }
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) continue;
      const pathname = decodeURIComponent(value.split(/[?#]/, 1)[0]);
      if (!pathname) continue;
      const target = pathname.startsWith("/")
        ? resolve(siteRoot, `.${pathname}`)
        : resolve(dirname(file), pathname);
      const inside = relative(siteRoot, target);
      if (inside.startsWith(`..${sep}`) || inside === ".." || isAbsolute(inside)) {
        errors.push(`${file}: local link escapes site root: ${value}`);
        continue;
      }
      const resolved = pathname.endsWith("/") ? join(target, "index.html") : target;
      if (!(await exists(resolved)) && !(await exists(join(resolved, "index.html")))) {
        errors.push(`${file}: broken local link: ${value}`);
      }
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Verified ${pageCount} pages across ${sites.length} sites.`);
}
