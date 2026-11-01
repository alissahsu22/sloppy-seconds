import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import animationsJson from "../toodles/animations.json";
import danceJson from "../toodles/dance/animations.json";
import {
  TOODLES_DANCE_ATLAS,
  TOODLES_DANCE_ATLAS_URL,
  TOODLES_DANCE_FIT,
  TOODLES_DANCE_FOOT,
  TOODLES_DANCE_FRAME,
  TOODLES_DANCE_FRAMES,
  TOODLES_DANCE_LOOP,
  TOODLES_DANCE_LOOPS,
  TOODLES_DANCE_RISE,
  TOODLES_DANCE_SETTLE,
  TOODLES_ATLAS,
  TOODLES_ATLAS_URL,
  TOODLES_FOOT,
  TOODLES_FRAME,
  TOODLES_FRAME_NAMES,
  clipForToodlesPose,
  scheduleToodlesEnding,
  toodlesAnchorsMatch,
  toodlesDanceCell,
  toodlesDanceUrl,
  toodlesEndingSteps,
  toodlesFrameCell,
  toodlesFrameUrl,
} from "./toodles";

describe("toodles aligned frames", () => {
  it("keeps one foot anchor so pose changes stay planted", () => {
    expect(toodlesAnchorsMatch()).toBe(true);
    expect(TOODLES_FRAME).toEqual({ width: 172, height: 109 });
    expect(TOODLES_FOOT.x).toBe(86);
    expect(TOODLES_FOOT.y).toBeCloseTo(108, 0);
  });

  it("points playback at the aligned canvases that shipped in the pack", () => {
    for (const name of TOODLES_FRAME_NAMES) {
      expect(toodlesFrameUrl(name)).toBe(`/assets/toodles/frames/aligned_192/${name}.png`);
      expect(existsSync(resolve(`public/assets/toodles/frames/aligned_192/${name}.png`))).toBe(true);
    }
  });

  it("reads walk, root, and sleep speeds from the pack", () => {
    expect(clipForToodlesPose("walk").frames).toEqual(animationsJson.animations.walk.frames);
    expect(clipForToodlesPose("walk").fps).toBe(animationsJson.animations.walk.fps);
    expect(clipForToodlesPose("root").frames).toEqual(["root_01", "root_02"]);
    expect(clipForToodlesPose("sleep").frames).toEqual(["sleep_01", "sleep_02"]);
  });

  it("picks jump drawings from vertical pose, not a timed loop", () => {
    expect(clipForToodlesPose("rise")).toEqual({ frames: ["jump_up"], fps: 0, loop: false });
    expect(clipForToodlesPose("peak")).toEqual({ frames: ["jump_peak"], fps: 0, loop: false });
    expect(clipForToodlesPose("fall")).toEqual({ frames: ["jump_down"], fps: 0, loop: false });
    expect(clipForToodlesPose("land")).toEqual({ frames: ["land"], fps: 0, loop: false });
  });

  it("keeps jump poses on one atlas so the picture is not swapped out", () => {
    expect(TOODLES_ATLAS_URL).toBe("/assets/toodles/atlases/toodles_atlas.png");
    expect(TOODLES_ATLAS).toEqual({ width: 860, height: 436 });
    expect(toodlesFrameCell("jump_up")).toEqual({ x: 172, y: 109, w: 172, h: 109 });
    expect(toodlesFrameCell("jump_peak")).toEqual({ x: 344, y: 109, w: 172, h: 109 });
    expect(toodlesFrameCell("jump_down")).toEqual({ x: 516, y: 109, w: 172, h: 109 });
    expect(toodlesFrameCell("land")).toEqual({ x: 688, y: 109, w: 172, h: 109 });
    for (const name of TOODLES_FRAME_NAMES) {
      const cell = toodlesFrameCell(name);
      expect(cell.x + cell.w).toBeLessThanOrEqual(TOODLES_ATLAS.width);
      expect(cell.y + cell.h).toBeLessThanOrEqual(TOODLES_ATLAS.height);
    }
  });

  it("keeps a dance pose from looping the sheet outside the ending", () => {
    expect(clipForToodlesPose("dance")).toEqual({ frames: ["idle_01"], fps: 0, loop: false });
  });
});

describe("toodles ending dance", () => {
  it("loads every dance frame from the sheet", () => {
    expect(TOODLES_DANCE_FRAME).toEqual({ width: 174, height: 200 });
    expect(TOODLES_DANCE_FOOT).toEqual({ x: 87, y: 197 });
    expect(TOODLES_DANCE_FIT).toBeGreaterThan(0);
    expect(TOODLES_DANCE_FIT).toBeLessThan(150 / 172);
    expect(TOODLES_DANCE_FRAMES).toHaveLength(24);
    for (const name of TOODLES_DANCE_FRAMES) {
      expect(toodlesDanceUrl(name)).toBe(`/assets/toodles/dance/frames_192/${name}.png`);
      expect(existsSync(resolve(`public/assets/toodles/dance/frames_192/${name}.png`))).toBe(true);
    }
  });

  it("plays the dance from one sheet so frames never blank between swaps", () => {
    expect(TOODLES_DANCE_ATLAS_URL).toBe("/assets/toodles/dance/toodles_dance_atlas.png");
    expect(existsSync(resolve(`public${TOODLES_DANCE_ATLAS_URL}`))).toBe(true);
    expect(TOODLES_DANCE_ATLAS).toEqual({ width: 174 * 8, height: 200 * 3 });
    expect(toodlesDanceCell("toodles_dance_01")).toEqual({ x: 0, y: 0 });
    expect(toodlesDanceCell("toodles_dance_10")).toEqual({ x: 174, y: 200 });
    expect(toodlesDanceCell("toodles_dance_24")).toEqual({ x: 174 * 7, y: 200 * 2 });
  });

  it("stands once, repeats only the middle dance, then settles onto all fours", () => {
    const full = scheduleToodlesEnding(false);
    const frames = full.events.map((event) => event.frame);
    const rise = [...TOODLES_DANCE_RISE];
    const loop = [...TOODLES_DANCE_LOOP];
    const settle = [...TOODLES_DANCE_SETTLE];
    expect(full.events[0]).toMatchObject({ frame: "land", sheet: "game", step: "land" });
    expect(frames.slice(1, 1 + rise.length)).toEqual(rise);
    expect(frames.slice(1 + rise.length, 1 + rise.length + loop.length * TOODLES_DANCE_LOOPS)).toEqual(
      Array.from({ length: TOODLES_DANCE_LOOPS }, () => loop).flat(),
    );
    expect(frames.slice(1 + rise.length + loop.length * TOODLES_DANCE_LOOPS)).toEqual(settle);
    expect(full.events.at(-1)).toMatchObject({ frame: "toodles_dance_24", sheet: "dance", step: "settle" });
    expect(full.doneAt).toBe(full.events.at(-1)?.at);
    expect(new Set(frames.filter((frame) => frame.startsWith("toodles_dance_"))).size).toBe(24);
    expect(toodlesEndingSteps(false).find((step) => step.id === "rise")?.repeats).toBe(1);
    expect(toodlesEndingSteps(false).find((step) => step.id === "settle")?.repeats).toBe(1);
    expect(toodlesEndingSteps(false).find((step) => step.id === "dance")?.fps).toBe(danceJson.animations.dance.fps);
    expect(full.doneAt).toBeGreaterThan(0);
    const again = scheduleToodlesEnding(false);
    expect(again.events.map((event) => event.frame)).toEqual(frames);
  });

  it("shows a still standing pose, then four legs, when motion is reduced", () => {
    const reduced = scheduleToodlesEnding(true);
    expect(reduced.events.map((event) => event.frame)).toEqual(["toodles_dance_08", "idle_01"]);
    expect(reduced.doneAt).toBeLessThan(scheduleToodlesEnding(false).doneAt);
  });
});
