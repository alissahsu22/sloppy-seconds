import { chromium, firefox, webkit, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { releaseSnippets } from "./squarespace-snippets.mjs";

const config = JSON.parse(await readFile("squarespace/install.json", "utf8"));
const { footer, launcher, version } = releaseSnippets(config, await readFile("dist/widget/sanctuary.js"));
const output = resolve("artifacts/squarespace-qa");
await mkdir(output, { recursive: true });
const results = [];
// Inject only into an isolated browser's memory. No Squarespace account or CMS writes.
for (const [name, engine, viewport, touch] of [
  ["chrome-desktop", chromium, { width: 1280, height: 800 }, false],
  ["firefox-desktop", firefox, { width: 1280, height: 800 }, false],
  ["safari-desktop", webkit, { width: 1280, height: 800 }, false],
  ["safari-phone", webkit, { width: 390, height: 844 }, true],
  ["safari-landscape", webkit, { width: 844, height: 390 }, true],
]) {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext({
      viewport,
      hasTouch: touch,
      ...(engine !== firefox ? { isMobile: touch } : {}),
    });
    const page = await context.newPage();
    const missing = [];
    const errors = [];
    page.on("pageerror", (error) => {
      if (error.stack?.includes("sanctuary.js")) errors.push(error.message);
    });
    // Exercise a cross-origin script and every image from the exact local release.
    await page.route(`${config.assetBase}/**`, async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (!/^\/(widget|assets)\//.test(path) || path.includes("..")) return route.abort();
      try {
        await route.fulfill({ path: resolve("dist", `.${path}`), headers: { "access-control-allow-origin": "*" } });
      } catch {
        missing.push(path);
        await route.abort();
      }
    });
    await page.goto(config.siteUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#team h1")).toBeVisible();
    const before = await page.locator("#team h1").innerText();
    await page.evaluate((html) => {
      const block = document.createElement("div");
      block.className = "sqs-block code-block sqs-block-code";
      const content = document.createElement("div");
      content.className = "sqs-block-content";
      content.innerHTML = html;
      block.append(content);
      document.querySelector("#team .sqs-layout")?.prepend(block);
    }, launcher);
    await page.evaluate(
      (html) =>
        new Promise((resolve, reject) => {
          const template = document.createElement("template");
          template.innerHTML = html;
          const script = document.createElement("script");
          for (const attr of template.content.querySelector("script").attributes)
            script.setAttribute(attr.name, attr.value);
          script.onload = resolve;
          script.onerror = () => reject(new Error("widget script failed to load"));
          document.body.append(script);
        }),
      footer,
    );
    await expect(page.locator(".ss-launcher")).toBeVisible();
    await page.locator(".ss-launcher").scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, `${name}-launcher.png`) });
    await page.getByRole("button", { name: "Start exploring, Wilbur" }).click();
    await expect(page.locator(".story-dialog[open]")).toBeVisible();
    const close = await page.locator(".story-close").boundingBox();
    if (!close || close.y < 0 || close.y + close.height > viewport.height)
      throw new Error("Close control is outside the viewport");
    await expect(page.locator(".stage")).toBeVisible();
    await page.screenshot({ path: resolve(output, `${name}-story.png`) });
    await page.getByRole("button", { name: "Skip to the ending" }).click();
    await page.locator(".story-close").click();
    await expect(page.locator(".pig-anchor")).toHaveCount(1);
    await page.evaluate(() => window.SloppySeconds.openStory("toodles"));
    await expect(page.locator(".story-titlebar h2")).toContainText("Not a number");
    await page.getByRole("button", { name: "Skip to the ending" }).click();
    await page.locator(".story-close").click();
    await expect(page.locator(".pig-anchor")).toHaveCount(2);
    await page.locator(".guide-button").click();
    await expect(page.locator(".guide-panel")).toBeVisible();
    await expect(page.locator(".guide-button-count")).toHaveText("2");
    await page.screenshot({ path: resolve(output, `${name}-guide.png`) });
    await page.locator(".story-close").click();
    await page.evaluate(() => window.SloppySeconds.unmount());
    await expect(page.locator("[data-ss-engine]")).toHaveCount(0);
    await expect(page.locator("#team h1")).toHaveText(before);
    await expect(page.locator("#team h1 .crew-letter")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
    if (missing.length || errors.length) throw new Error(JSON.stringify({ missing, errors }));
    results.push({ name, passed: true, viewport });
    console.log(
      `PASS ${name}: real Squarespace page, cross-origin launcher, both stories, roaming pigs, guide, removal`,
    );
    await context.close();
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  } finally {
    await browser.close();
  }
}
await writeFile(
  resolve(output, "results.json"),
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      url: config.siteUrl,
      version,
      method: "Temporary browser injection of local build; no CMS changes or deployment",
      results,
    },
    null,
    2,
  ),
);
if (results.some((result) => !result.passed)) process.exitCode = 1;
