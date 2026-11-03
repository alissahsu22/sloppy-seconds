import { afterEach, describe, expect, it } from "vitest";
import { assetUrl, getAssetBase, setAssetBase } from "./base";

describe("asset URLs", () => {
  afterEach(() => setAssetBase(""));

  it("keeps root-relative paths until a host origin is configured", () => {
    expect(assetUrl("/assets/wilbur/wilbur_atlas.png")).toBe("/assets/wilbur/wilbur_atlas.png");
    expect(assetUrl("assets/wilbur/wilbur_atlas.png")).toBe("/assets/wilbur/wilbur_atlas.png");
  });

  it("prefixes a hosted origin and ignores extra slashes", () => {
    setAssetBase("https://sloppy-seconds.vercel.app/");
    expect(getAssetBase()).toBe("https://sloppy-seconds.vercel.app");
    expect(assetUrl("/assets/toodles/atlases/toodles_atlas.png")).toBe(
      "https://sloppy-seconds.vercel.app/assets/toodles/atlases/toodles_atlas.png",
    );
  });
});
