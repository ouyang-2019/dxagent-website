import { cp, lstat, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "./product-data.mjs";
import { renderProductSites } from "./product-sites.mjs";
import { renderProductCards } from "./product-cards.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public");
const output = join(root, "dist");
const sites = ["home", "blog", "apps", "projects"];
const sharedFiles = ["tokens.css", "styles.css", "main.js"];

// Keep the generated-file cleanup pinned to this repository's dist directory.
if (dirname(output) !== root || output === root) {
  throw new Error("Unexpected output directory");
}

const existingOutput = await lstat(output).catch(() => null);
if (existingOutput) {
  const realRoot = await realpath(root);
  const realOutput = await realpath(output);
  const fromRoot = relative(realRoot, realOutput);
  if (
    existingOutput.isSymbolicLink() ||
    fromRoot === ".." ||
    fromRoot.startsWith(`..${sep}`) ||
    isAbsolute(fromRoot)
  ) {
    throw new Error("Output directory escapes this repository");
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const site of sites) {
  const destination = join(output, site);
  await mkdir(destination, { recursive: true });

  if (site === "home") {
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (entry.isFile()) {
        await cp(join(source, entry.name), join(destination, entry.name));
      }
    }
  } else {
    const siteSource = join(source, site);
    if (!(await stat(siteSource).catch(() => null))?.isDirectory()) {
      throw new Error(`Missing site source: public/${site}`);
    }
    await cp(siteSource, destination, { recursive: true });
    for (const file of sharedFiles) {
      await cp(join(source, file), join(destination, file));
    }
  }
  if (site === "projects") {
    await renderProductSites({ products, output: destination });
  }
  if (site === "home" || site === "projects") {
    const indexFile = join(destination, "index.html");
    const html = await readFile(indexFile, "utf8");
    if (!html.includes("<!-- PRODUCT-CARDS -->")) throw new Error(`Missing product section in ${site}`);
    await writeFile(indexFile, html.replace("<!-- PRODUCT-CARDS -->", renderProductCards(products, site === "home" ? "https://projects.dxagent.cloud/" : "")));
  }
  console.log(`${site}: ${destination}`);
}
