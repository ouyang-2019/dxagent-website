// Uses an existing Playwright installation; this repository adds no dependency.
// node scripts/browser-check.mjs --playwright <absolute module path> [--chrome <path>]
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argumentsMap = new Map();
for (let i = 2; i < process.argv.length; i += 2) argumentsMap.set(process.argv[i], process.argv[i + 1]);
const require = createRequire(import.meta.url);
const { chromium } = require(argumentsMap.get("--playwright") || "playwright");
const chrome = argumentsMap.get("--chrome");
const ports = ["home", "blog", "apps", "projects"].map((name, i) => [name, `http://127.0.0.1:${50213 + i}`]);
const origins = Object.fromEntries(ports);
const pages = [
  ["home", "home", "/"], ["blog", "blog", "/"], ["apps", "apps", "/"], ["projects", "projects", "/"],
  ...["aubeau", "super-lovart", "xuanjian", "ai-cosmetics", "shortdrama", "fragrance", "skillgene", "openstock-enhanced", "niu-lai-video-translator"].map(name => [name, "projects", `/${name}/`]),
  ["json-tool", "apps", "/json-tool/"],
  ...["site-launch", "tool-calling", "ai-coding-workflow", "ai-app-security"].map(name => [name, "blog", `/articles/${name}/`]),
];
const after = join(root, "screenshots", "after");
const evidence = { date: new Date().toISOString(), pages: [], checks: [] };
const interactionsOnly = argumentsMap.get("--interactions-only") === "true";
if (interactionsOnly) {
  const previous = JSON.parse(await readFile(join(after, "manifest.json"), "utf8"));
  evidence.pages = previous.pages;
  evidence.checks = previous.checks.filter(check => /\/(1440|390|768):/.test(check.name));
}
const browser = await chromium.launch({ headless: true, ...(chrome ? { executablePath: chrome } : {}) });
await mkdir(after, { recursive: true });

function check(name, actual, expected = true) {
  assert.deepEqual(actual, expected, name);
  evidence.checks.push({ name, passed: true });
}

async function revealAll(page) {
  await page.evaluate(() => document.fonts.ready);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 650) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(35);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

try {
  // Each width uses a fresh context, so repeated builds cannot reuse stale CSS.
  for (const width of interactionsOnly ? [] : [1440, 390, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    for (const [name, site, path] of pages) {
      const errors = [];
      const failedAssets = [];
      const onError = error => errors.push(error.message);
      const onResponse = response => { if (response.status() >= 400) failedAssets.push(`${response.status()} ${response.url()}`); };
      page.on("pageerror", onError);
      page.on("response", onResponse);
      const response = await page.goto(origins[site] + path, { waitUntil: "networkidle" });
      await revealAll(page);
      const metrics = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map(el => el.id);
        return {
          title: document.title,
          h1: document.querySelectorAll("h1").length,
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i),
          brokenFragments: [...document.querySelectorAll('a[href^="#"]')].map(el => el.getAttribute("href")).filter(href => !document.getElementById(href.slice(1))),
          unlabelledImages: document.querySelectorAll("img:not([alt])").length,
        };
      });
      check(`${name}/${width}: HTTP`, response.status(), 200);
      check(`${name}/${width}: page errors`, errors, []);
      check(`${name}/${width}: failed assets`, failedAssets, []);
      check(`${name}/${width}: one heading`, metrics.h1, 1);
      check(`${name}/${width}: no horizontal overflow`, metrics.width <= width);
      check(`${name}/${width}: unique IDs`, metrics.duplicateIds, []);
      check(`${name}/${width}: valid fragments`, metrics.brokenFragments, []);
      check(`${name}/${width}: image labels`, metrics.unlabelledImages, 0);
      await page.screenshot({ path: join(after, `${name}-${width}.png`), fullPage: true });
      if (name === "home" && width !== 768) {
        await page.screenshot({ path: join(after, `home-${width}-hero.png`) });
        if (width === 390) {
          await page.locator("[data-nav-toggle]").click();
          await page.screenshot({ path: join(after, "home-390-menu.png") });
        }
      }
      evidence.pages.push({ name, site, path, viewport: { width, height: 900 }, status: response.status(), ...metrics });
      page.off("pageerror", onError);
      page.off("response", onResponse);
      console.log(`Screenshot and page checks: ${name} / ${width}`);
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  for (const [name, site, path] of pages.filter(([, , path]) => path === "/" || ["/aubeau/", "/super-lovart/", "/xuanjian/", "/ai-cosmetics/", "/shortdrama/", "/fragrance/"].includes(path))) {
    await page.goto(origins[site] + path);
    const toggle = page.locator("[data-nav-toggle], [data-menu-toggle]");
    await toggle.click();
    check(`${name}: menu opens`, await toggle.getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Escape");
    check(`${name}: menu Escape`, await toggle.getAttribute("aria-expanded"), "false");
    check(`${name}: restored focus`, await toggle.evaluate(el => document.activeElement === el));
    await toggle.click();
    await page.mouse.click(5, 880);
    check(`${name}: outside closes menu`, await toggle.getAttribute("aria-expanded"), "false");
    if (path !== "/") {
      await page.locator(".skip-link").focus();
      await page.keyboard.press("Enter");
      check(`${name}: skip link focus`, await page.locator("#main").evaluate(el => document.activeElement === el));
      const tabs = page.getByRole("tab");
      check(`${name}: three demo tabs`, await tabs.count(), 3);
      await tabs.nth(0).focus();
      for (const [key, selected] of [["ArrowRight", 1], ["End", 2], ["Home", 0], ["ArrowLeft", 2]]) {
        await page.keyboard.press(key);
        check(`${name}: tabs ${key}`, await tabs.nth(selected).getAttribute("aria-selected"), "true");
        check(`${name}: one visible panel ${key}`, await page.getByRole("tabpanel").count(), 1);
      }
      await tabs.nth(1).click();
      check(`${name}: tabs pointer`, await tabs.nth(1).getAttribute("aria-selected"), "true");
      const faq = page.locator("details").first();
      const wasOpen = await faq.evaluate(el => el.open);
      await faq.locator("summary").click();
      check(`${name}: FAQ toggles`, await faq.evaluate(el => el.open), !wasOpen);
      await faq.locator("summary").click();
      check(`${name}: FAQ restores`, await faq.evaluate(el => el.open), wasOpen);
    }
  }
  await page.goto(origins.apps + "/json-tool/");
  const network = [];
  page.on("request", request => network.push(request.url()));
  const sample = '{"name":"DX Agent","ok":true,"items":[1,2]}';
  await page.locator("#json-input").fill(sample);
  await page.locator("#btn-format").click();
  check("JSON: format", await page.locator("#json-output").textContent(), JSON.stringify(JSON.parse(sample), null, 2));
  await page.locator("#btn-copy").click();
  await page.waitForFunction(() => document.getElementById("tool-status").textContent.includes("已复制"));
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  check("JSON: clipboard", clipboardText.replaceAll("\r\n", "\n"), JSON.stringify(JSON.parse(sample), null, 2));
  await page.locator("#btn-minify").click();
  check("JSON: minify", await page.locator("#json-output").textContent(), sample);
  await page.locator("#json-input").fill('{"broken":}');
  await page.locator("#btn-format").click();
  check("JSON: invalid status", await page.locator("#tool-status").getAttribute("data-tone"), "error");
  check("JSON: invalid clears stale output", await page.locator("#json-output").textContent(), "");
  await page.locator("#btn-clear").click();
  check("JSON: clear input", await page.locator("#json-input").inputValue(), "");
  check("JSON: clear focus", await page.locator("#json-input").evaluate(el => document.activeElement === el));
  await page.locator("#btn-format").click();
  check("JSON: empty is helpful", await page.locator("#tool-status").textContent(), "请先在输入框中粘贴 JSON 内容。");
  await page.locator("#json-input").fill(sample);
  await page.locator("#json-input").press("Control+Enter");
  check("JSON: shortcut", await page.locator("#json-output").textContent(), JSON.stringify(JSON.parse(sample), null, 2));
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("test permission denial")) } });
    window.copyAttempts = 0;
    document.execCommand = () => { window.copyAttempts++; return true; };
  });
  await page.locator("#btn-copy").click();
  await page.waitForFunction(() => window.copyAttempts > 0);
  check("JSON: denied clipboard uses fallback", await page.locator("#tool-status").getAttribute("data-tone"), "ok");
  await page.evaluate(() => { document.execCommand = () => false; });
  await page.locator("#btn-copy").click();
  await page.waitForFunction(() => document.getElementById("tool-status").getAttribute("data-tone") === "error");
  check("JSON: copy failure keeps result", (await page.locator("#json-output").textContent()).length > 0);
  check("JSON: user data never sent", network, []);
  await context.close();

  for (const javaScriptEnabled of [false, true]) {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: "reduce", viewport: { width: 390, height: 900 } });
    const page = await context.newPage();
    for (const [name, site, path] of pages.filter(([name]) => ["home", "blog", "apps", "projects", "aubeau", "shortdrama"].includes(name))) {
      await page.goto(origins[site] + path);
      check(`${name}: content visible with JS ${javaScriptEnabled}`, await page.locator("h1").isVisible());
      check(`${name}: reduced motion with JS ${javaScriptEnabled}`, await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), "auto");
      if (!javaScriptEnabled) {
        check(`${name}: no-JS nav visible`, await page.locator(".site-header nav a").first().isVisible());
        if (path !== "/") check(`${name}: all no-JS demo states available`, await page.getByRole("tabpanel").count(), 3);
      }
    }
    await context.close();
  }
  console.log(`Passed ${evidence.checks.length} browser checks; ${evidence.pages.length} page screenshots.`);
} catch (error) {
  evidence.failure = error.stack;
  throw error;
} finally {
  await writeFile(join(after, "manifest.json"), JSON.stringify(evidence, null, 2) + "\n");
  await browser.close();
}
