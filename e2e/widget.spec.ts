import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    SloppySeconds?: {
      mount(options?: {
        assetBase?: string;
        helpHref?: string;
        onlyPath?: string;
        strainPhotos?: string;
        strainLetters?: string;
        clearance?: string;
      }): unknown;
      unmount(): void;
      openStory(id: "wilbur" | "toodles", opener?: HTMLElement | null): void;
      openGuide(opener?: HTMLElement | null): void;
    };
  }
}

const hostButton = (page: Page, story: "wilbur" | "toodles") => page.locator(`[data-ss-story="${story}"]`);

/** Move a host control into the gap between the header and the roaming pigs. */
async function clearOfPigs(page: Page, story: "wilbur" | "toodles") {
  const button = hostButton(page, story);
  await button.evaluate((node) => {
    const root = document.querySelector("[data-ss-engine]")?.shadowRoot;
    const obstacles = root ? [...root.querySelectorAll(".pig-anchor, .strip")] : [];
    let ceiling = window.innerHeight;
    const rect = node.getBoundingClientRect();
    for (const obstacle of obstacles) {
      const box = obstacle.getBoundingClientRect();
      if (box.height < 2 || box.bottom < rect.top || box.top > rect.bottom) continue;
      const overlapsX = box.right > rect.left && box.left < rect.right;
      if (!overlapsX && !obstacle.classList.contains("strip")) continue;
      ceiling = Math.min(ceiling, box.top);
    }
    const header = document.querySelector("header");
    const floor = (header?.getBoundingClientRect().bottom ?? 0) + 8;
    if (rect.top >= floor && rect.bottom <= ceiling - 8) return;
    const target = Math.max(floor, ceiling - rect.height - 8);
    window.scrollBy(0, rect.top - target);
  });
  return button;
}

async function openStory(page: Page, story: "wilbur" | "toodles") {
  const button = await clearOfPigs(page, story);
  await button.click();
  await expect(page.locator(".story-dialog[open]")).toBeVisible();
}

/**
 * Wilbur's next plank is offset on purpose, so a pig who never steers falls.
 * Steering runs inside the page so a slow test runner cannot drop the key mid-jump.
 */
async function climbWilbur(page: Page): Promise<boolean> {
  const steer = () =>
    page.evaluate(
      () =>
        new Promise<{ tilted: boolean; ended: boolean }>((resolve) => {
          const deadline = performance.now() + 20_000;
          let tilted = false;

          const finish = (ended: boolean) => {
            for (const key of ["ArrowLeft", "ArrowRight"]) {
              window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
            }
            resolve({ tilted, ended });
          };

          const tick = () => {
            const root = document.querySelector("[data-ss-engine]")?.shadowRoot;
            const photo = document.querySelector("[data-ss-strain='photo']");
            if (photo instanceof HTMLElement && getComputedStyle(photo).transform !== "none") tilted = true;
            const ending = root?.querySelector("#ending-title");
            if (ending && !ending.closest("[hidden]")) {
              finish(true);
              return;
            }
            const stage = root?.querySelector(".stage");
            if (stage instanceof HTMLElement) stage.focus();
            if (!(stage instanceof HTMLElement) || stage.getAttribute("data-fallen") === "1") {
              finish(false);
              return;
            }
            const pig = root.querySelector(".pig-slot");
            const moved =
              pig instanceof HTMLElement ? /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(pig.style.transform) : null;
            let next: "left" | "right" | "none" = "none";
            if (moved && root) {
              const pigX = Number(moved[1]) + 75;
              const foot = Number(moved[2]) + 116;
              let target: { x: number; y: number; width: number } | null = null;
              for (const node of root.querySelectorAll(".platform")) {
                if (!(node instanceof HTMLElement)) continue;
                if (node.classList.contains("is-falling") || node.dataset.stage === "broken") continue;
                const place = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(node.style.transform);
                if (!place) continue;
                const x = Number(place[1]);
                const y = Number(place[2]);
                const width = Number.parseFloat(node.style.width) || 0;
                const standing = Math.abs(y - foot) < 36 && pigX > x - 8 && pigX < x + width + 8;
                if (standing || y > foot + 130 || y < foot - 150) continue;
                if (!target || y > target.y) target = { x, y, width };
              }
              if (target) {
                const center = target.x + target.width / 2;
                if (center < pigX - 10) next = "left";
                else if (center > pigX + 10) next = "right";
              }
            }
            for (const key of ["ArrowLeft", "ArrowRight"]) {
              const want = (next === "left" && key === "ArrowLeft") || (next === "right" && key === "ArrowRight");
              window.dispatchEvent(
                new KeyboardEvent(want ? "keydown" : "keyup", { key, bubbles: true, cancelable: true }),
              );
            }
            if (performance.now() > deadline) {
              finish(false);
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
    );

  let tilted = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.locator(".stage").click();
    await expect(page.locator(".stage[data-holding='1']")).toHaveCount(0);
    await page.locator(".stage").focus();
    const result = await steer();
    if (result.tilted) tilted = true;
    if (result.ended) return tilted;
    const again = page.getByRole("button", { name: "Try again" });
    if (!(await again.isVisible())) return tilted;
    await again.click();
  }
  return tilted;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/fixtures/host.html");
  await expect(page.locator("[data-ss-engine]")).toHaveCount(1);
});

test("keeps the host page's type, buttons, and navigation", async ({ page }) => {
  await expect(page.locator("h1")).toHaveCSS("font-family", /Georgia/);
  await expect(page.locator("h1")).toHaveCSS("color", "rgb(11, 107, 58)");
  await expect(page.locator("body")).toHaveCSS("margin-top", "40px");
  await expect(hostButton(page, "wilbur")).toHaveCSS("border-radius", "16px");
  await expect(hostButton(page, "wilbur")).toHaveCSS("background-color", "rgb(215, 236, 255)");
  const launcher = page.locator(".ss-launcher .hero-play-button");
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveCSS("border-radius", "0px");
  await page.locator(".host-header a").first().click();
  await expect(page).toHaveURL(/#host-about$/);
});

test("mounts once, then again after it is removed", async ({ page }) => {
  await page.evaluate(() => {
    window.SloppySeconds?.mount();
    window.SloppySeconds?.mount();
  });
  await expect(page.locator("[data-ss-engine]")).toHaveCount(1);
  await expect(page.locator("[data-ss-strain='letters'] .crew-letter").first()).toBeAttached();

  await page.evaluate(() => window.SloppySeconds?.unmount());
  await expect(page.locator("[data-ss-engine]")).toHaveCount(0);
  await expect(page.locator(".pig-anchor")).toHaveCount(0);
  await expect(page.locator("[data-ss-strain='letters'] .crew-letter")).toHaveCount(0);
  await expect(page.locator("[data-ss-strain='letters']")).toContainText("rescued animals");
  await expect(page.locator("h1")).toHaveCSS("font-family", /Georgia/);

  await page.evaluate(() => {
    window.SloppySeconds?.mount({ assetBase: "", helpHref: "https://example.test/ways-to-help" });
    window.SloppySeconds?.mount({ assetBase: "https://cdn.example.test" });
  });
  await expect(page.locator("[data-ss-engine]")).toHaveCount(1);
  await openStory(page, "toodles");
  await expect(page.locator(".story-titlebar h2")).toContainText("Not a number");
});

test("the API opens a story immediately after mounting", async ({ page }) => {
  await page.evaluate(() => {
    window.SloppySeconds?.unmount();
    window.SloppySeconds?.openStory("toodles");
  });
  await expect(page.locator(".story-titlebar h2")).toContainText("Not a number");
  await page.keyboard.press("Escape");
  await expect(page.locator(".story-dialog")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
});

test("reuses the widget when a duplicate script is inserted", async ({ page }) => {
  await page.addScriptTag({ url: "/widget/sanctuary.js?duplicate" });
  await expect(page.locator("[data-ss-engine]")).toHaveCount(1);
  await expect(page.locator(".ss-launcher")).toHaveCount(1);
  await openStory(page, "wilbur");
});

test("Squarespace navigation removes the widget and restores it once on return", async ({ page }) => {
  await page.evaluate(() => {
    window.SloppySeconds?.unmount();
    window.SloppySeconds?.mount({ onlyPath: "/fixtures/host.html" });
    history.pushState({}, "", "/contact");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.locator("[data-ss-engine]")).toHaveCount(0);
  await page.evaluate(() => {
    history.pushState({}, "", "/fixtures/host.html");
    document.dispatchEvent(new Event("mercury:load"));
  });
  await expect(page.locator("[data-ss-engine]")).toHaveCount(1);
  await openStory(page, "wilbur");
  await page.evaluate(() => document.dispatchEvent(new Event("mercury:unload")));
  await expect(page.locator("[data-ss-engine]")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("position", "fixed");
  await page.evaluate(() => document.dispatchEvent(new Event("mercury:load")));
  await expect(page.locator("[data-ss-engine]")).toHaveCount(1);
});

test("a replaced Squarespace Code block receives a working launcher", async ({ page }) => {
  await page.locator("[data-ss-mount]").evaluate((node) => node.replaceWith(node.cloneNode(false)));
  await expect(page.locator(".ss-launcher")).toHaveCount(1);
  await expect(page.locator("[data-ss-engine]")).toHaveCount(1);
  await page.getByRole("button", { name: "Start exploring, Wilbur" }).click();
  await expect(page.locator(".story-dialog[open]")).toBeVisible();
});

test("configured photo and heading selectors restore the original host markup", async ({ page }) => {
  await page.evaluate(() => {
    window.SloppySeconds?.unmount();
    document.querySelector(".host-photo")?.removeAttribute("data-ss-strain");
    document.querySelector(".host-aside")?.removeAttribute("data-ss-strain");
    window.SloppySeconds?.mount({ strainPhotos: ".host-photo", strainLetters: ".host-aside" });
  });
  await expect(page.locator(".host-photo")).toHaveAttribute("data-ss-strain", "photo");
  await expect(page.locator(".host-aside .crew-letter").first()).toBeAttached();
  await page.evaluate(() => window.SloppySeconds?.unmount());
  await expect(page.locator(".host-photo")).not.toHaveAttribute("data-ss-strain");
  await expect(page.locator(".host-aside")).not.toHaveAttribute("data-ss-strain");
  await expect(page.locator(".host-aside .crew-letter")).toHaveCount(0);
  await expect(page.locator(".host-aside")).toHaveText("The rescued animals at the sanctuary");
});

test("clearance follows a donate bar inserted or resized after load", async ({ page }) => {
  await page.locator(".host-donate").evaluate((node) => ((node as HTMLElement).style.height = "80px"));
  await expect
    .poll(async () => {
      const donate = (await page.locator(".host-donate").boundingBox())!;
      const guide = (await page.locator(".guide-button").boundingBox())!;
      return guide.y + guide.height <= donate.y;
    })
    .toBe(true);
  await page.locator(".host-donate").evaluate((node) => node.remove());
  await expect
    .poll(() => page.locator("[data-ss-engine]").evaluate((node) => node.style.getPropertyValue("--ss-clear-bottom")))
    .toBe("0px");
});

test("hosted asset URLs are rewritten inside the widget", async ({ page }) => {
  await page.evaluate(() => {
    window.SloppySeconds?.unmount();
    window.SloppySeconds?.mount({
      assetBase: "https://cdn.example.test",
      helpHref: "https://example.test/ways-to-help",
    });
  });
  const css = await page.locator("[data-ss-engine]").evaluate((node) => {
    const sheet = (node as HTMLElement).shadowRoot?.adoptedStyleSheets[0];
    if (!sheet) return "";
    return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
  });
  expect(css).toContain("https://cdn.example.test/assets/toodles/environment/backdrops/tuft.png");
  expect(css).not.toContain(":root");
});

test("opens both stories, the Field Guide, and restores focus", async ({ page }) => {
  await openStory(page, "wilbur");
  await page.getByRole("button", { name: "Skip to the ending" }).click();
  await expect(page.getByRole("heading", { name: "Still think he's a teacup?" })).toBeVisible();
  const help = page.getByRole("link", { name: "Help pigs like Wilbur" });
  await expect(help).toHaveAttribute("href", "https://example.test/ways-to-help");
  await page.getByRole("button", { name: "View entry" }).click();
  await expect(page.locator(".guide-panel")).toBeVisible();
  await page.locator(".guide-back").click();
  await page.locator(".story-close").click();
  await expect(page.locator(".story-dialog")).toHaveCount(0);
  await expect(hostButton(page, "wilbur")).toBeFocused();
  await expect(page.locator(".pig-anchor")).toBeVisible();

  await openStory(page, "toodles");
  await page.getByRole("button", { name: "Skip to the ending" }).click();
  await expect(page.getByRole("heading", { name: "Toodles." })).toBeVisible();
  await page.locator(".story-close").click();
  await expect(page.locator(".pig-anchor")).toHaveCount(2);
});

test("the launcher can choose Toodles, and the guide button opens the Field Guide", async ({ page }) => {
  await page.getByRole("button", { name: "Next animal" }).click();
  await page.getByRole("button", { name: "Start exploring, Toodles" }).click();
  await expect(page.locator(".story-titlebar h2")).toContainText("Not a number");
  await page.locator(".story-close").click();
  await page.locator(".guide-button").click();
  await expect(page.locator(".guide-panel")).toBeVisible();
});

test("saved progress comes back on this origin after a reload", async ({ page }) => {
  await openStory(page, "wilbur");
  await page.getByRole("button", { name: "Skip to the ending" }).click();
  await page.locator(".story-close").click();
  await page.reload();
  await expect(page.locator(".guide-button-count")).toHaveText("1");
  await expect(page.locator(".pig-anchor")).toBeVisible();
});

test("pigs and the guide button stay off the host navigation and donate bar", async ({ page }) => {
  await openStory(page, "wilbur");
  await page.getByRole("button", { name: "Skip to the ending" }).click();
  await page.locator(".story-close").click();
  const donate = (await page.locator(".host-donate").boundingBox())!;
  const header = (await page.locator(".host-header").boundingBox())!;
  const pig = (await page.locator(".pig-anchor").boundingBox())!;
  const guide = (await page.locator(".guide-button").boundingBox())!;
  expect(pig.y + pig.height).toBeLessThanOrEqual(donate.y + 1);
  expect(guide.y + guide.height).toBeLessThanOrEqual(donate.y + 1);
  expect(pig.y).toBeGreaterThanOrEqual(header.y + header.height);
  await expect(page.locator(".host-donate")).toBeEnabled();
});

test.describe("keyboard", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard steering is a desktop check");

  test("arrow keys steer Wilbur inside the host page", async ({ page }) => {
    await openStory(page, "wilbur");
    await page.locator(".stage").click();
    await expect(page.locator(".stage[data-holding='1']")).toHaveCount(0);
    const read = () => page.locator(".pig-slot").evaluate((node) => (node as HTMLElement).style.transform);
    const start = await read();
    const startX = Number(/translate3d\(([-\d.]+)px/.exec(start)?.[1] ?? NaN);
    await page.locator(".stage").focus();
    await page.keyboard.down("ArrowLeft");
    await page.waitForTimeout(400);
    await page.keyboard.up("ArrowLeft");
    const left = Number(/translate3d\(([-\d.]+)px/.exec(await read())?.[1] ?? NaN);
    expect(left).toBeLessThan(startX);
  });
});

test.describe("touch", () => {
  test.skip(({ isMobile }) => !isMobile, "touch is a phone check");

  test("tapping the stage starts Wilbur", async ({ page }) => {
    await openStory(page, "wilbur");
    await expect(page.locator(".intro-begin")).toHaveText("Tap to start");
    await page.locator(".stage").tap();
    await expect(page.locator(".stage[data-holding='1']")).toHaveCount(0);
  });
});

test("reduced motion still opens the story", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await openStory(page, "wilbur");
  await expect(page.getByText("Animations are simplified to match your system settings.")).toBeVisible();
  await page.getByRole("button", { name: "Skip to the ending" }).click();
  await expect(page.locator(".pig-anchor")).toBeVisible();
});

test.describe("breakout", () => {
  test.skip(({ isMobile }) => isMobile, "the full climb is checked on desktop");

  test("Wilbur strains a marked photo, breaks out, and lands on the host page", async ({ page }) => {
    test.setTimeout(90_000);
    await openStory(page, "wilbur");
    const tilted = await climbWilbur(page);
    expect(tilted).toBe(true);
    await expect(page.getByRole("heading", { name: "Still think he's a teacup?" })).toBeVisible();
    await expect(page.locator(".pig-anchor")).toBeVisible();
    const pig = (await page.locator(".pig-anchor").boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(pig.y).toBeGreaterThan(viewport.height * 0.5);
  });
});
