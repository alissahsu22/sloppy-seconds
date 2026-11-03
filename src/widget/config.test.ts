import { describe, expect, it } from "vitest";
import { pathMatches, resolveOptions, shouldMount } from "./config";

describe("widget configuration", () => {
  it("treats a trailing slash as the same animals path", () => {
    expect(pathMatches("/our-animals/", "/our-animals")).toBe(true);
    expect(pathMatches("/our-animals", "/resources")).toBe(false);
    expect(pathMatches("/", "/")).toBe(true);
  });

  it("keeps earlier settings when a later call omits them", () => {
    const first = resolveOptions({
      assetBase: "https://sloppy-seconds.vercel.app",
      helpHref: "https://example.test/help",
      onlyPath: "/our-animals",
    });
    const second = resolveOptions({ launcher: false }, first);
    expect(second.assetBase).toBe("https://sloppy-seconds.vercel.app");
    expect(second.helpHref).toBe("https://example.test/help");
    expect(second.onlyPath).toBe("/our-animals");
    expect(second.launcher).toBe(false);
    expect(second.mount).toBe("[data-ss-mount]");
  });

  it("mounts only when this page opted in", () => {
    const options = resolveOptions({ onlyPath: "/our-animals" });
    const animals = { querySelector: () => ({}) as Element };
    const elsewhere = { querySelector: () => null };
    expect(shouldMount(options, animals, "/our-animals")).toBe(true);
    expect(shouldMount(options, animals, "/contact")).toBe(false);
    expect(shouldMount(options, elsewhere, "/our-animals")).toBe(false);
  });
});
