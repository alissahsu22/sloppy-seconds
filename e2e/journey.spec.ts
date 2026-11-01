import { expect, test, type Page } from "@playwright/test";

const launch = (page: Page) => page.locator("#wilbur .story-launch-button");
const dialog = (page: Page) => page.locator(".story-dialog[open]");

async function openGame(page: Page) {
  await page.goto("/");
  await launch(page).scrollIntoViewIfNeeded();
  await launch(page).click();
  await expect(dialog(page)).toBeVisible();
}

async function skipToEnding(page: Page) {
  await page.getByRole("button", { name: "Skip to the ending" }).click();
  await expect(page.locator(".ended:not([hidden])")).toBeVisible();
  // Once he lands, the window eases up above his lane. Measure after it stops.
  await page
    .locator(".story-dialog")
    .evaluate((node) => Promise.all(node.getAnimations().map((animation) => animation.finished)));
}

/** Wilbur's drawn x in the game, in world pixels. */
async function pigX(page: Page) {
  const transform = await page.locator(".pig-slot").evaluate((node) => (node as HTMLElement).style.transform);
  return Number(/translate3d\(([-\d.]+)px/.exec(transform)?.[1] ?? NaN);
}

test("skip, Field Guide, back, close, and focus returns to the opener", async ({ page }) => {
  await openGame(page);
  await skipToEnding(page);
  await page.getByRole("button", { name: "View entry" }).click();
  await expect(page.locator(".guide-panel")).toBeVisible();
  await page.locator(".guide-back").click();
  await expect(page.locator(".ended:not([hidden])")).toBeVisible();
  await page.locator(".story-close").click();
  await expect(dialog(page)).toHaveCount(0);
  await expect(launch(page)).toBeFocused();
});

test("Escape closes the window, and try again starts a fresh run", async ({ page }) => {
  await openGame(page);
  await skipToEnding(page);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".stage[data-holding='1']")).toBeVisible();
  await expect(page.locator(".strain-crack")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
});

test("the collection survives a refresh", async ({ page }) => {
  await openGame(page);
  await skipToEnding(page);
  await page.locator(".story-close").click();
  await page.reload();
  await expect(page.locator(".guide-button-count")).toHaveText("1");
  await expect(page.locator(".pig-anchor")).toBeVisible();
});

test("the window and its close button stay on screen", async ({ page }) => {
  await openGame(page);
  const viewport = page.viewportSize()!;
  for (const step of ["game", "ending"]) {
    if (step === "ending") await skipToEnding(page);
    const win = (await page.locator(".story-window").boundingBox())!;
    expect(win.y).toBeGreaterThanOrEqual(0);
    expect(win.y + win.height).toBeLessThanOrEqual(viewport.height);
    await expect(page.locator(".story-close")).toBeInViewport({ ratio: 1 });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("the whole playfield is drawn inside the stage", async ({ page }) => {
  await openGame(page);
  const stage = (await page.locator(".stage").evaluate((node) => [node.clientWidth, node.clientHeight])) as number[];
  const world = (await page.locator(".world").boundingBox())!;
  expect(world.width).toBeLessThanOrEqual(stage[0] + 0.5);
  expect(world.height).toBeLessThanOrEqual(stage[1] + 0.5);
  // The physics never runs a world shorter than 220px. A shorter stage scales it down instead of cropping it.
  const logical = await page.locator(".world").evaluate((node) => (node as HTMLElement).offsetHeight);
  expect(logical).toBeGreaterThanOrEqual(220);
});

test("the ending scrolls as one region and reaches every action", async ({ page }) => {
  await openGame(page);
  await skipToEnding(page);
  await expect(page.locator(".ended")).toHaveCSS("overflow", "visible");
  for (const name of ["Help pigs like Wilbur", "Try again", "View entry"]) {
    const target = page.getByRole(name === "Help pigs like Wilbur" ? "link" : "button", { name });
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeInViewport({ ratio: 0.95 });
  }
});

test("Wilbur's speech bubble stays in his lane and on screen", async ({ page }) => {
  await openGame(page);
  await skipToEnding(page);
  const hit = page.locator(".pig-hit");
  let shown = 0;
  for (let attempt = 0; attempt < 60 && shown < 3; attempt += 1) {
    await hit.dispatchEvent("click");
    const bubble = page.locator(".bubble");
    if (!(await bubble.isVisible())) continue;
    shown += 1;
    // A long line, to push it against the edges.
    await bubble.evaluate((node) => {
      node.textContent = "ooh, a sticker, look, it is for you";
      window.dispatchEvent(new Event("resize"));
    });
    const box = (await bubble.boundingBox())!;
    const strip = (await page.locator(".strip").boundingBox())!;
    const win = (await page.locator(".story-window").boundingBox())!;
    const width = await page.evaluate(() => document.documentElement.clientWidth);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(strip.y);
    expect(box.y).toBeGreaterThanOrEqual(win.y + win.height);
    // Let him walk somewhere else before the next line.
    await page.waitForTimeout(1800);
  }
  expect(shown).toBe(3);
});

test.describe("keyboard", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard steering is a desktop check");

  test("any key starts the run and the arrows steer", async ({ page }) => {
    await openGame(page);
    await expect(page.locator(".intro-begin")).toHaveText("Press any key to start");
    await page.keyboard.press("Space");
    await expect(page.locator(".stage[data-holding='1']")).toHaveCount(0);
    const start = await pigX(page);
    await page.keyboard.down("ArrowLeft");
    await page.waitForTimeout(400);
    await page.keyboard.up("ArrowLeft");
    const left = await pigX(page);
    expect(left).toBeLessThan(start);
    await page.keyboard.down("d");
    await page.waitForTimeout(600);
    await page.keyboard.up("d");
    expect(await pigX(page)).toBeGreaterThan(left);
  });
});

test.describe("touch", () => {
  test.skip(({ isMobile }) => !isMobile, "touch is a phone check");

  test("tapping the stage starts the run, and the title bar does not", async ({ page }) => {
    await openGame(page);
    await expect(page.locator(".intro-begin")).toHaveText("Tap to start");
    await page.locator(".story-titlebar h2").tap();
    await expect(page.locator(".stage[data-holding='1']")).toBeVisible();
    await page.locator(".stage").tap();
    await expect(page.locator(".stage[data-holding='1']")).toHaveCount(0);
  });
});

test("the run pauses while the page is hidden", async ({ page, isMobile }) => {
  await openGame(page);
  if (isMobile) await page.locator(".stage").tap();
  else await page.keyboard.press("Space");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  // Let any frame already in flight finish before taking the reading.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  const age = await page.locator(".age-readout-value").textContent();
  const before = await page.locator(".pig-slot").evaluate((node) => (node as HTMLElement).style.transform);
  await page.waitForTimeout(800);
  expect(await page.locator(".pig-slot").evaluate((node) => (node as HTMLElement).style.transform)).toBe(before);
  expect(await page.locator(".age-readout-value").textContent()).toBe(age);
});
