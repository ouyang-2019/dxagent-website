import { cp, lstat, mkdir, readdir, realpath, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public");
const output = join(root, "dist");
const sites = ["home", "blog", "apps", "projects"];
const sharedFiles = ["styles.css", "main.js"];

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
  console.log(`${site}: ${destination}`);
}
