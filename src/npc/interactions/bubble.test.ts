import { describe, expect, it } from "vitest";
import { BUBBLE_EDGE, BUBBLE_REACH, bubbleLeft } from "./bubble";

describe("speech bubble placement", () => {
  it("sits in front of his face", () => {
    expect(bubbleLeft(500, 1, 80, 1280)).toBe(500 + BUBBLE_REACH);
    expect(bubbleLeft(500, -1, 80, 1280)).toBe(500 - BUBBLE_REACH - 80);
  });

  it("moves behind his head when the screen runs out in front", () => {
    expect(bubbleLeft(1200, 1, 110, 1280)).toBe(1200 - BUBBLE_REACH - 110);
    expect(bubbleLeft(78, -1, 110, 1280)).toBe(78 + BUBBLE_REACH);
  });

  it("stays on screen at every spot, facing, and width", () => {
    for (const viewport of [320, 568, 844, 1280]) {
      for (const width of [40, 110, 200, 290]) {
        for (let pigX = 0; pigX <= viewport; pigX += 13) {
          for (const facing of [1, -1] as const) {
            const left = bubbleLeft(pigX, facing, width, viewport);
            expect(left).toBeGreaterThanOrEqual(BUBBLE_EDGE);
            expect(left + width).toBeLessThanOrEqual(viewport - BUBBLE_EDGE);
          }
        }
      }
    }
  });
});
